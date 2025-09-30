export const influencer_profiles = `query MyQuery {
  influencer_profiles {
    audience_size
    bio
    categories
    city
    created_at
    dob
    event_participation_count
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
    }
  }
}
`