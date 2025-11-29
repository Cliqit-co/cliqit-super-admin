export const QUERY_INFLUENCER_PROFILES = `
  query GetInfluencerProfiles {
    influencer_profiles(order_by: {created_at: desc}) {
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

// FCM Token Management
export const QUERY_FCM_TOKENS = `
  query GetFCMTokens($user_id: uuid!) {
    fcm_tokens(where: {user_id: {_eq: $user_id}}, order_by: {updated_at: desc}) {
      id
      fcm_token
      platform
      created_at
      updated_at
    }
  }
`

export const MUTATION_INSERT_FCM_TOKEN = `
  mutation InsertFCMToken($user_id: uuid!, $fcm_token: String!, $platform: String) {
    insert_fcm_tokens_one(object: {
      user_id: $user_id,
      fcm_token: $fcm_token,
      platform: $platform
    }) {
      id
      fcm_token
      platform
      created_at
    }
  }
`

export const MUTATION_UPDATE_FCM_TOKEN = `
  mutation UpdateFCMToken($user_id: uuid!, $fcm_token: String!, $platform: String) {
    update_fcm_tokens(
      where: {user_id: {_eq: $user_id}},
      _set: {
        fcm_token: $fcm_token,
        platform: $platform,
        updated_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        fcm_token
        platform
        updated_at
      }
    }
  }
`

export const MUTATION_DELETE_FCM_TOKEN = `
  mutation DeleteFCMToken($user_id: uuid!) {
    delete_fcm_tokens(where: {user_id: {_eq: $user_id}}) {
      affected_rows
    }
  }
`

// Notification History
export const QUERY_NOTIFICATION_HISTORY = `
  query GetNotificationHistory($user_id: uuid!, $limit: Int = 50) {
    notification_history(
      where: {user_id: {_eq: $user_id}},
      order_by: {sent_at: desc},
      limit: $limit
    ) {
      id
      notification_type
      title
      body
      sent_at
      success
      error_message
    }
  }
`

export const QUERY_NOTIFICATION_STATS = `
  query GetNotificationStats($user_id: uuid!) {
    notification_history_aggregate(where: {user_id: {_eq: $user_id}}) {
      aggregate {
        count
      }
    }
    notification_history(
      where: {user_id: {_eq: $user_id}, success: {_eq: true}},
      order_by: {sent_at: desc},
      limit: 1
    ) {
      sent_at
    }
  }
`

export type FCMTokenRow = {
  id: string
  fcm_token: string
  platform?: string
  created_at: string
  updated_at: string
}

export type NotificationHistoryRow = {
  id: string
  notification_type: string
  title: string
  body: string
  sent_at: string
  success: boolean
  error_message?: string
}

export type InsertFCMTokenResult = {
  insert_fcm_tokens_one: FCMTokenRow | null
}

export type UpdateFCMTokenResult = {
  update_fcm_tokens: {
    affected_rows: number
    returning: FCMTokenRow[]
  }
}

export type DeleteFCMTokenResult = {
  delete_fcm_tokens: {
    affected_rows: number
  }
}

export type NotificationHistoryResult = {
  notification_history: NotificationHistoryRow[]
}

export type NotificationStatsResult = {
  notification_history_aggregate: {
    aggregate: {
      count: number
    }
  }
  notification_history: Array<{
    sent_at: string
  }>
}

export const QUERY_DASHBOARD_STATS = `
  query GetDashboardStats {
    influencer_profiles_aggregate {
      aggregate {
        count
      }
    }
    user_acceptance_aggregate(where: {verified_user: {_eq: false}}) {
      aggregate {
        count
      }
    }
    user_acceptance_approved: user_acceptance_aggregate(where: {verified_user: {_eq: true}}) {
      aggregate {
        count
      }
    }
  }
`

export type DashboardStatsResult = {
  influencer_profiles_aggregate: {
    aggregate: {
      count: number
    }
  }
  user_acceptance_aggregate: {
    aggregate: {
      count: number
    }
  }
  user_acceptance_approved: {
    aggregate: {
      count: number
    }
  }
}