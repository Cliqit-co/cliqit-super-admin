import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ── DB row shapes ──────────────────────────────────────────────────────────────

interface BusinessListRow {
  user_id: string
  business_name: string | null
  business_category: string | null
  city: string | null
  state: string | null
  logo: string | null
  cover_image: string | null
  description: string | null
  website_url: string | null
  social_media_url: string | null
  social_links: Record<string, unknown> | null
  phone_number: string | null
  address: string | null
  pin_code: string | null
  verified_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Joined from users (via RPC)
  email: string | null
  user_deleted_at: string | null
}

interface GigRow {
  id: string
  title: string
  status: string
  compensation_type: string
  compensation_amount: number | null
  city: string | null
  created_at: string
  deleted_at: string | null
}

interface EventRow {
  id: string
  title: string
  status: string
  event_date_time: string | null
  capacity: number | null
  city: string | null
  created_at: string
  deleted_at: string | null
}

interface BusinessDetailRow {
  user_id: string
  business_name: string | null
  business_category: string | null
  city: string | null
  state: string | null
  pin_code: string | null
  address: string | null
  phone_number: string | null
  website_url: string | null
  social_media_url: string | null
  social_links: Record<string, unknown> | null
  logo: string | null
  cover_image: string | null
  photos: unknown[] | null
  description: string | null
  verified_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  // from RPC
  email: string | null
  phone_number_user: string | null
  gigs: GigRow[] | null
  events: EventRow[] | null
}

// ── Exported TS types ──────────────────────────────────────────────────────────

export type BusinessProfile = {
  userId: string
  businessName: string | null
  category: string | null
  city: string | null
  state: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  description: string | null
  websiteUrl: string | null
  socialMediaUrl: string | null
  socialLinks: Record<string, unknown> | null
  phoneNumber: string | null
  address: string | null
  pinCode: string | null
  verifiedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  // from users join
  email: string | null
  userDeletedAt: string | null
}

export type BusinessGig = {
  id: string
  title: string
  status: string
  compensationType: string
  compensationAmount: number | null
  city: string | null
  createdAt: string
  deletedAt: string | null
}

export type BusinessEvent = {
  id: string
  title: string
  status: string
  eventDateTime: string | null
  capacity: number | null
  city: string | null
  createdAt: string
  deletedAt: string | null
}

export type BusinessDetail = BusinessProfile & {
  photos: unknown[] | null
  emailUser: string | null
  phoneNumberUser: string | null
  gigs: BusinessGig[]
  events: BusinessEvent[]
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapBusinessProfile(row: BusinessListRow): BusinessProfile {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    category: row.business_category,
    city: row.city,
    state: row.state,
    logoUrl: resolveStorageUrl(row.logo),
    coverImageUrl: resolveStorageUrl(row.cover_image),
    description: row.description,
    websiteUrl: row.website_url,
    socialMediaUrl: row.social_media_url,
    socialLinks: row.social_links,
    phoneNumber: row.phone_number,
    address: row.address,
    pinCode: row.pin_code,
    verifiedAt: row.verified_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: row.email,
    userDeletedAt: row.user_deleted_at,
  }
}

function mapGig(g: GigRow): BusinessGig {
  return {
    id: g.id,
    title: g.title,
    status: g.status,
    compensationType: g.compensation_type,
    compensationAmount: g.compensation_amount,
    city: g.city,
    createdAt: g.created_at,
    deletedAt: g.deleted_at,
  }
}

function mapEvent(e: EventRow): BusinessEvent {
  return {
    id: e.id,
    title: e.title,
    status: e.status,
    eventDateTime: e.event_date_time,
    capacity: e.capacity,
    city: e.city,
    createdAt: e.created_at,
    deletedAt: e.deleted_at,
  }
}

// ── Reads ──────────────────────────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<BusinessProfile[]> {
  try {
    const { data, error } = await supabase.rpc("admin_list_businesses")
    if (error) {
      console.error("[fetchBusinesses] RPC error:", error.message)
      return []
    }
    const rows = (data ?? []) as unknown as BusinessListRow[]
    return rows.map(mapBusinessProfile)
  } catch (err) {
    console.error("[fetchBusinesses] unexpected error:", err)
    return []
  }
}

export async function fetchBusinessDetail(
  userId: string
): Promise<BusinessDetail | null> {
  try {
    const { data, error } = await supabase.rpc("admin_get_business", {
      p_user_id: userId,
    })
    if (error) {
      console.error("[fetchBusinessDetail] RPC error:", error.message)
      return null
    }
    if (!data) return null
    const row = data as unknown as BusinessDetailRow
    const profile = mapBusinessProfile({
      user_id: row.user_id,
      business_name: row.business_name,
      business_category: row.business_category,
      city: row.city,
      state: row.state,
      logo: row.logo,
      cover_image: row.cover_image,
      description: row.description,
      website_url: row.website_url,
      social_media_url: row.social_media_url,
      social_links: row.social_links,
      phone_number: row.phone_number,
      address: row.address,
      pin_code: row.pin_code,
      verified_at: row.verified_at,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      email: row.email,
      user_deleted_at: null,
    })
    return {
      ...profile,
      photos: row.photos ?? null,
      emailUser: row.email,
      phoneNumberUser: row.phone_number_user,
      gigs: (row.gigs ?? []).map(mapGig),
      events: (row.events ?? []).map(mapEvent),
    }
  } catch (err) {
    console.error("[fetchBusinessDetail] unexpected error:", err)
    return null
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Set or clear the business profile's verified_at timestamp.
 * This is the ONLY place verified_at is written; never include it in profile patches.
 */
export async function setBusinessVerified(
  userId: string,
  verified: boolean
): Promise<void> {
  const { error } = await supabase
    .from("business_profiles")
    .update({ verified_at: verified ? new Date().toISOString() : null })
    .eq("user_id", userId)
  if (error) throw new Error(`Failed to ${verified ? "verify" : "unverify"} business: ${error.message}`)
}

/**
 * Patch mutable fields on business_profiles.
 * NEVER include verified_at, geog, or search_vector in the patch.
 */
export type BusinessProfilePatch = Partial<{
  business_name: string
  business_category: string
  address: string
  city: string
  state: string
  pin_code: string
  phone_number: string
  website_url: string
  social_media_url: string
  social_links: Record<string, unknown>
  description: string
}>

export async function updateBusinessProfile(
  userId: string,
  patch: BusinessProfilePatch
): Promise<void> {
  // Safety: strip any forbidden columns if accidentally included
  const safe = { ...patch } as Record<string, unknown>
  delete safe["verified_at"]
  delete safe["geog"]
  delete safe["search_vector"]

  const { error } = await supabase
    .from("business_profiles")
    .update(safe)
    .eq("user_id", userId)
  if (error) throw new Error(`Failed to update business profile: ${error.message}`)
}

/**
 * Suspend or restore a business user (sets/clears users.deleted_at).
 * NOTE: suspending does NOT cancel live gigs — warn in the UI before calling.
 */
export async function setBusinessSuspended(
  userId: string,
  suspend: boolean
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: suspend ? new Date().toISOString() : null })
    .eq("id", userId)
  if (error) throw new Error(`Failed to ${suspend ? "suspend" : "restore"} business user: ${error.message}`)
}
