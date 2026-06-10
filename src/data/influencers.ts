import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

export type InfluencerProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  username: string
  avatarUrl?: string | null
  city?: string | null
  audienceSize?: string | null
  niche?: string | null
  categories?: string[] | null
  socialLinks?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  verifiedUser: boolean
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  bio?: string | null
}

interface UserWithProfileRow {
  id: string
  email: string
  email_verified: boolean
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  verified_user: boolean
  accepted_tm: boolean
  accepted_pp: boolean
  influencer_profiles: Array<{
    audience_size: string | null
    bio: string | null
    categories: string[] | null
    city: string | null
    first_name: string | null
    last_name: string | null
    niche: string | null
    social_links: Record<string, unknown> | null
    username: string | null
    created_at: string | null
    updated_at: string | null
  }> | null
}

export async function fetchInfluencerProfiles(): Promise<InfluencerProfile[]> {
  // Pull all influencer-role users with their profile via a SECURITY DEFINER
  // RPC guarded by is_super_admin(). PII columns (email) are column-restricted
  // on public.users for the authenticated role, so the direct select can no
  // longer read them — the RPC returns the full rows for super-admins only.
  const { data, error } = await supabase.rpc("admin_list_influencers")

  if (error) throw error

  const rows = (data ?? []) as unknown as UserWithProfileRow[]
  return rows.map((row) => {
    const profile = row.influencer_profiles?.[0] ?? null
    return {
      id: row.id,
      firstName: profile?.first_name ?? row.display_name ?? "",
      lastName: profile?.last_name ?? "",
      email: row.email,
      emailVerified: !!row.email_verified,
      username: profile?.username ?? row.email?.split("@")[0] ?? "unknown",
      avatarUrl: resolveStorageUrl(row.avatar_url ?? undefined),
      city: profile?.city ?? null,
      audienceSize: profile?.audience_size ?? null,
      niche: profile?.niche ?? null,
      categories: profile?.categories ?? null,
      socialLinks: profile?.social_links ?? null,
      createdAt: profile?.created_at ?? row.created_at,
      updatedAt: profile?.updated_at ?? row.updated_at,
      verifiedUser: !!row.verified_user,
      acceptedTerms: !!row.accepted_tm,
      acceptedPrivacy: !!row.accepted_pp,
      bio: profile?.bio ?? null,
    }
  })
}

export async function updateUserVerification(
  userId: string,
  verified: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ verified_user: verified })
    .eq("id", userId)
  if (error) {
    console.error("Failed to update user verification:", error)
    throw new Error("Failed to update user verification status")
  }
  return true
}
