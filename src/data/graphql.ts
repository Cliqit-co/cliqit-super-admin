export const QUERY_INFLUENCER_PROFILES = `
  query GetInfluencerProfiles {
    influencer_profiles {
    audience_size
    bio
    categories
    city
    created_at
    first_name
    last_name
    niche
    social_links
    updated_at
    user_id
    username
    user {
      avatarUrl
      email
      emailVerified
      id
      displayName
    }
  }
}
`

export type InfluencerProfileRow = {
  audience_size: string | null
  bio: string | null
  categories: string[] | null
  city: string | null
  created_at: string
  first_name: string
  last_name: string
  niche: string | null
  social_links: Record<string, unknown> | null
  updated_at: string
  user_id: string
  username: string
  user: {
    avatarUrl: string | null
    email: string
    emailVerified: boolean
    id: string
    displayName: string | null
  }
}

export const QUERY_USER_ACCEPTANCE = `
  query GetUserAcceptance {
    user_acceptance {
      user_id
      accepted_tm
      accepted_pp
      verified_user
    }
  }
`

export type UserAcceptanceRow = {
  user_id: string
  accepted_tm: boolean
  accepted_pp: boolean
  verified_user: boolean
}

export const MUTATION_UPDATE_USER_VERIFICATION = `
  mutation UpdateUserVerification($user_id: uuid!, $verified_user: Boolean!) {
    update_user_acceptance_by_pk(pk_columns: {user_id: $user_id}, _set: {verified_user: $verified_user}) {
      accepted_pp
      accepted_tm
      user_id
      verified_user
    }
  }
`

export type UpdateUserVerificationResult = {
  update_user_acceptance_by_pk: UserAcceptanceRow | null
}