import { NhostClient } from '@nhost/nextjs'

const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'your-subdomain',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || 'us-east-1',
})

export { nhost }

// GraphQL queries for the admin panel
export const GET_USERS = `
  query GetUsers($limit: Int, $offset: Int, $where: users_bool_exp) {
    users(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
      id
      email
      display_name
      avatar_url
      created_at
      updated_at
      last_seen
      metadata
    }
  }
`

export const GET_INFLUENCERS = `
  query GetInfluencers($limit: Int, $offset: Int, $where: influencers_bool_exp) {
    influencers(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
      id
      user_id
      follower_count
      engagement_rate
      niche
      location
      languages
      vetting_status
      vetting_score
      vetting_notes
      verified_at
      social_media_profiles {
        platform
        username
        url
        follower_count
        engagement_rate
        verified
      }
      user {
        id
        email
        display_name
        avatar_url
        created_at
      }
    }
  }
`

export const GET_APPLICATIONS = `
  query GetApplications($limit: Int, $offset: Int, $where: applications_bool_exp) {
    applications(limit: $limit, offset: $offset, where: $where, order_by: { applied_at: desc }) {
      id
      user_id
      gig_id
      status
      applied_at
      reviewed_at
      reviewed_by
      notes
      attachments
      metadata
      user {
        id
        email
        display_name
      }
      gig {
        id
        title
        description
        budget
        currency
        deadline
        status
        category
        business_id
        business {
          id
          company_name
        }
      }
    }
  }
`

export const GET_ANALYTICS = `
  query GetAnalytics($dateFrom: timestamptz!, $dateTo: timestamptz!) {
    userAnalytics: users_aggregate(where: { created_at: { _gte: $dateFrom, _lte: $dateTo } }) {
      aggregate {
        count
      }
    }
    applicationAnalytics: applications_aggregate(where: { applied_at: { _gte: $dateFrom, _lte: $dateTo } }) {
      aggregate {
        count
      }
    }
    revenueAnalytics: gigs_aggregate(where: { created_at: { _gte: $dateFrom, _lte: $dateTo } }) {
      aggregate {
        sum {
          budget
        }
      }
    }
  }
`

export const UPDATE_USER_STATUS = `
  mutation UpdateUserStatus($id: uuid!, $status: user_status!) {
    update_users_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`

export const UPDATE_INFLUENCER_VETTING = `
  mutation UpdateInfluencerVetting($id: uuid!, $vetting_status: vetting_status!, $vetting_score: Int, $vetting_notes: String) {
    update_influencers_by_pk(
      pk_columns: { id: $id }
      _set: { 
        vetting_status: $vetting_status
        vetting_score: $vetting_score
        vetting_notes: $vetting_notes
        verified_at: $vetting_status == "approved" ? "now()" : null
      }
    ) {
      id
      vetting_status
      vetting_score
      vetting_notes
      verified_at
    }
  }
`

export const UPDATE_APPLICATION_STATUS = `
  mutation UpdateApplicationStatus($id: uuid!, $status: application_status!, $notes: String) {
    update_applications_by_pk(
      pk_columns: { id: $id }
      _set: { 
        status: $status
        notes: $notes
        reviewed_at: "now()"
        reviewed_by: "current_user_id()"
      }
    ) {
      id
      status
      notes
      reviewed_at
      reviewed_by
    }
  }
`
