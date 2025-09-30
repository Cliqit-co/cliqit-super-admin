import { graphqlRequest } from "@/lib/graphql-client"
import { QUERY_INFLUENCER_PROFILES, QUERY_USER_ACCEPTANCE, type InfluencerProfileRow, type UserAcceptanceRow } from "./graphql"
import { getNhostFileUrl } from "@/lib/nhost-storage"

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

function mapRowToInfluencerProfile(row: InfluencerProfileRow): InfluencerProfile {
  return {
    id: row.user_id,
    firstName: row.first_name ?? row.user?.displayName ?? "",
    lastName: row.last_name ?? "",
    email: row.user?.email ?? "",
    emailVerified: !!row.user?.emailVerified,
    username: row.username,
    avatarUrl: row.user?.avatarUrl ?? null,
    city: row.city,
    audienceSize: row.audience_size,
    niche: row.niche,
    categories: row.categories,
    socialLinks: row.social_links,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    verifiedUser: false,
    acceptedTerms: false,
    acceptedPrivacy: false,
    bio: row.bio,
  }
}

type InfluencerProfilesQueryResult = {
  influencer_profiles: InfluencerProfileRow[]
}

type UserAcceptanceQueryResult = {
  user_acceptance: UserAcceptanceRow[]
}

export async function fetchInfluencerProfiles(): Promise<InfluencerProfile[]> {
  const [profilesRes, acceptanceRes] = await Promise.all([
    graphqlRequest<InfluencerProfilesQueryResult>(QUERY_INFLUENCER_PROFILES),
    graphqlRequest<UserAcceptanceQueryResult>(QUERY_USER_ACCEPTANCE),
  ])

  const acceptanceByUserId = new Map<string, UserAcceptanceRow>()
  for (const row of acceptanceRes.user_acceptance || []) {
    acceptanceByUserId.set(row.user_id, row)
  }

  const mapped = (profilesRes.influencer_profiles || []).map((row) => {
    const base = mapRowToInfluencerProfile(row)
    const acc = acceptanceByUserId.get(base.id)
    return {
      ...base,
      verifiedUser: !!acc?.verified_user,
      acceptedTerms: !!acc?.accepted_tm,
      acceptedPrivacy: !!acc?.accepted_pp,
    }
  })

  // Resolve avatar URLs in parallel for any that look like file IDs
  const resolved = await Promise.all(
    mapped.map(async (p) => ({
      ...p,
      avatarUrl: await getNhostFileUrl(p.avatarUrl || undefined),
    }))
  )

  return resolved
}


