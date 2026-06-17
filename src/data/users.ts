import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"
import type { UserRole } from "@/types/db"

// ---- Types ----

export type AdminUser = {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: UserRole | null
  verifiedUser: boolean
  emailVerified: boolean
  phoneNumber: string | null
  phoneNumberVerified: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  onboardingCompleted: boolean
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  // status derived from deletedAt
  status: "active" | "suspended"
}

export type AdminUserDetail = AdminUser & {
  influencerProfile?: {
    firstName: string | null
    lastName: string | null
    username: string | null
    city: string | null
    audienceSize: string | null
    niche: string | null
    categories: string[] | null
    bio: string | null
    socialLinks: Record<string, unknown> | null
  } | null
  businessProfile?: {
    businessName: string | null
    businessCategory: string | null
    city: string | null
    address: string | null
    website: string | null
    description: string | null
  } | null
  counts: {
    gigs: number
    events: number
    applications: number
  }
  lastDeleteRequest: string | null
}

export type UserStats = {
  bySuperAdmin: number
  byBusiness: number
  byInfluencer: number
  active: number
  deleted: number
}

export type DeletionRequest = {
  userId: string
  email: string
  displayName: string | null
  deletedAt: string | null
  graceUntil: string | null
  requestedAt: string
}

// ---- Read RPCs (try/catch → safe empty if undeployed) ----

export interface FetchUsersParams {
  search?: string
  role?: string
  status?: string
  verified?: boolean
  emailConf?: boolean
  limit?: number
  offset?: number
  sort?: string
}

export async function fetchUsers(
  params: FetchUsersParams = {}
): Promise<{ total: number; rows: AdminUser[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_search: params.search ?? null,
      p_role: params.role ?? null,
      p_status: params.status ?? null,
      p_verified: params.verified ?? null,
      p_email_conf: params.emailConf ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
      p_sort: params.sort ?? null,
    })
    if (error || !data) return { total: 0, rows: [] }

    const result = data as { total: number; rows: RawUserRow[] }
    return {
      total: result.total ?? 0,
      rows: (result.rows ?? []).map(mapAdminUser),
    }
  } catch {
    return { total: 0, rows: [] }
  }
}

export async function fetchUser(id: string): Promise<AdminUserDetail | null> {
  try {
    const { data, error } = await supabase.rpc("admin_get_user", {
      p_user_id: id,
    })
    if (error || !data) return null

    const raw = data as RawUserDetailRow
    // RPC may return nested {user: {...}} or a flat object
    const userRow: RawUserRow = raw.user ?? (raw as unknown as RawUserRow)
    const base = mapAdminUser(userRow)
    return {
      ...base,
      influencerProfile: raw.influencer_profile
        ? {
            firstName: raw.influencer_profile.first_name ?? null,
            lastName: raw.influencer_profile.last_name ?? null,
            username: raw.influencer_profile.username ?? null,
            city: raw.influencer_profile.city ?? null,
            audienceSize: raw.influencer_profile.audience_size ?? null,
            niche: raw.influencer_profile.niche ?? null,
            categories: raw.influencer_profile.categories ?? null,
            bio: raw.influencer_profile.bio ?? null,
            socialLinks: raw.influencer_profile.social_links ?? null,
          }
        : null,
      businessProfile: raw.business_profile
        ? {
            businessName: raw.business_profile.business_name ?? null,
            businessCategory: raw.business_profile.business_category ?? null,
            city: raw.business_profile.city ?? null,
            address: raw.business_profile.address ?? null,
            website: raw.business_profile.website_url ?? null,
            description: raw.business_profile.description ?? null,
          }
        : null,
      counts: {
        gigs: raw.counts?.gigs ?? 0,
        events: raw.counts?.events ?? 0,
        applications: raw.counts?.applications ?? 0,
      },
      lastDeleteRequest: raw.last_delete_request ?? null,
    }
  } catch {
    return null
  }
}

export async function fetchUserStats(): Promise<UserStats> {
  try {
    const { data, error } = await supabase.rpc("admin_user_stats")
    if (error || !data) return emptyStats()

    const raw = data as RawUserStats
    return {
      bySuperAdmin: raw.byRole?.superAdmin ?? 0,
      byBusiness: raw.byRole?.business ?? 0,
      byInfluencer: raw.byRole?.influencer ?? 0,
      active: raw.active ?? 0,
      deleted: raw.deleted ?? 0,
    }
  } catch {
    return emptyStats()
  }
}

export async function fetchDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const { data, error } = await supabase.rpc("admin_list_delete_requests")
    if (error || !data) return []

    const rows = data as RawDeletionRequest[]
    return rows.map((r) => ({
      userId: r.user_id,
      email: r.email,
      displayName: r.display_name ?? null,
      deletedAt: r.deleted_at ?? null,
      graceUntil: r.grace_until ?? null,
      requestedAt: r.requested_at,
    }))
  } catch {
    return []
  }
}

// ---- Mutations (throw errors so callers can toast) ----

export async function setUserSuspended(
  id: string,
  suspend: boolean
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: suspend ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function setUserRole(id: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", id)
  if (error) {
    // errcode 42501 = last super admin protection
    if (error.code === "42501" || error.message?.includes("last super admin")) {
      throw new Error("Cannot demote the last super admin.")
    }
    throw new Error(error.message)
  }
}

export async function setUserVerified(
  id: string,
  verified: boolean
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ verified_user: verified })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function restoreUser(id: string): Promise<void> {
  // 1. Clear deleted_at on the user
  const { error: userErr } = await supabase
    .from("users")
    .update({ deleted_at: null })
    .eq("id", id)
  if (userErr) throw new Error(userErr.message)

  // 2. Delete the delete_requests row (best-effort)
  await supabase.from("delete_requests").delete().eq("user_id", id)
}

// ---- Internal helpers ----

interface RawUserRow {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string | null
  verified_user: boolean | null
  email_verified: boolean | null
  phone_number: string | null
  phone_number_verified: boolean | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  onboarding_completed: boolean | null
  accepted_tm: boolean | null
  accepted_pp: boolean | null
}

interface RawUserDetailRow {
  user?: RawUserRow
  // also may be flat (handle both)
  id?: string
  email?: string
  influencer_profile?: {
    first_name: string | null
    last_name: string | null
    username: string | null
    city: string | null
    audience_size: string | null
    niche: string | null
    categories: string[] | null
    bio: string | null
    social_links: Record<string, unknown> | null
  } | null
  business_profile?: {
    business_name: string | null
    business_category: string | null
    city: string | null
    address: string | null
    website_url: string | null
    description: string | null
  } | null
  counts?: {
    gigs: number
    events: number
    applications: number
  }
  last_delete_request?: string | null
  // flat fields (if RPC returns flat object rather than nested user)
  display_name?: string | null
  avatar_url?: string | null
  role?: string | null
  verified_user?: boolean | null
  email_verified?: boolean | null
  phone_number?: string | null
  phone_number_verified?: boolean | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
  onboarding_completed?: boolean | null
  accepted_tm?: boolean | null
  accepted_pp?: boolean | null
}

interface RawUserStats {
  byRole?: {
    superAdmin?: number
    business?: number
    influencer?: number
  }
  active?: number
  deleted?: number
}

interface RawDeletionRequest {
  user_id: string
  email: string
  display_name: string | null
  deleted_at: string | null
  grace_until: string | null
  requested_at: string
}

function mapAdminUser(row: RawUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: resolveStorageUrl(row.avatar_url ?? undefined),
    role: (row.role as UserRole) ?? null,
    verifiedUser: !!row.verified_user,
    emailVerified: !!row.email_verified,
    phoneNumber: row.phone_number ?? null,
    phoneNumberVerified: !!row.phone_number_verified,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    onboardingCompleted: !!row.onboarding_completed,
    acceptedTerms: !!row.accepted_tm,
    acceptedPrivacy: !!row.accepted_pp,
    status: row.deleted_at ? "suspended" : "active",
  }
}

function emptyStats(): UserStats {
  return {
    bySuperAdmin: 0,
    byBusiness: 0,
    byInfluencer: 0,
    active: 0,
    deleted: 0,
  }
}
