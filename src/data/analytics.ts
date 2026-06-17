import { supabase } from "@/lib/supabase"

// ---- Return types ----

export type PlatformStats = {
  usersByRole: { superAdmin: number; business: number; influencer: number }
  gigsByStatus: { draft: number; active: number; completed: number; cancelled: number }
  eventsByStatus: {
    draft: number
    active: number
    upcoming: number
    ongoing: number
    completed: number
    cancelled: number
  }
  submissionsByStatus: {
    pending_review: number
    completed: number
    rejected: number
  }
  applicationsFunnel: {
    applied: number
    approved: number
    started: number
    verification_pending: number
    completed: number
  }
  influencerVerification: { verified: number; unverified: number }
}

export type SignupBucket = {
  bucket: string
  count: number
}

export type TopBusiness = {
  userId: string
  businessName: string
  gigCount: number
  eventCount: number
  totalCount: number
}

export type TopInfluencer = {
  userId: string
  username: string
  displayName: string | null
  gigCompletionCount: number
}

// ---- Default / zero values ----

const DEFAULT_PLATFORM_STATS: PlatformStats = {
  usersByRole: { superAdmin: 0, business: 0, influencer: 0 },
  gigsByStatus: { draft: 0, active: 0, completed: 0, cancelled: 0 },
  eventsByStatus: { draft: 0, active: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 },
  submissionsByStatus: { pending_review: 0, completed: 0, rejected: 0 },
  applicationsFunnel: {
    applied: 0,
    approved: 0,
    started: 0,
    verification_pending: 0,
    completed: 0,
  },
  influencerVerification: { verified: 0, unverified: 0 },
}

// ---- Fetch functions ----

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const { data, error } = await supabase.rpc("admin_platform_stats")
    if (error) {
      console.warn("admin_platform_stats RPC error:", error.message)
      return DEFAULT_PLATFORM_STATS
    }
    const d = data as Record<string, unknown>
    return {
      usersByRole: (d?.usersByRole as PlatformStats["usersByRole"]) ?? DEFAULT_PLATFORM_STATS.usersByRole,
      gigsByStatus: (d?.gigsByStatus as PlatformStats["gigsByStatus"]) ?? DEFAULT_PLATFORM_STATS.gigsByStatus,
      eventsByStatus: (d?.eventsByStatus as PlatformStats["eventsByStatus"]) ?? DEFAULT_PLATFORM_STATS.eventsByStatus,
      submissionsByStatus: (d?.submissionsByStatus as PlatformStats["submissionsByStatus"]) ?? DEFAULT_PLATFORM_STATS.submissionsByStatus,
      applicationsFunnel: (d?.applicationsFunnel as PlatformStats["applicationsFunnel"]) ?? DEFAULT_PLATFORM_STATS.applicationsFunnel,
      influencerVerification: (d?.influencerVerification as PlatformStats["influencerVerification"]) ?? DEFAULT_PLATFORM_STATS.influencerVerification,
    }
  } catch (e) {
    console.warn("fetchPlatformStats failed:", e)
    return DEFAULT_PLATFORM_STATS
  }
}

export async function fetchSignupTimeseries(
  bucket: "day" | "week" | "month",
  from: Date,
): Promise<SignupBucket[]> {
  try {
    const { data, error } = await supabase.rpc("admin_signup_timeseries", {
      p_bucket: bucket,
      p_from: from.toISOString(),
    })
    if (error) {
      console.warn("admin_signup_timeseries RPC error:", error.message)
      return []
    }
    const rows = (data ?? []) as Array<{ bucket: string; count: number }>
    return rows.map((r) => ({ bucket: r.bucket, count: Number(r.count) }))
  } catch (e) {
    console.warn("fetchSignupTimeseries failed:", e)
    return []
  }
}

export async function fetchTopBusinesses(limit = 10): Promise<TopBusiness[]> {
  try {
    const { data, error } = await supabase.rpc("admin_top_businesses", {
      p_limit: limit,
    })
    if (error) {
      console.warn("admin_top_businesses RPC error:", error.message)
      return []
    }
    const rows = (data ?? []) as Array<{
      user_id: string
      business_name: string
      gig_count: number
      event_count: number
    }>
    return rows.map((r) => ({
      userId: r.user_id,
      businessName: r.business_name,
      gigCount: Number(r.gig_count ?? 0),
      eventCount: Number(r.event_count ?? 0),
      totalCount: Number(r.gig_count ?? 0) + Number(r.event_count ?? 0),
    }))
  } catch (e) {
    console.warn("fetchTopBusinesses failed:", e)
    return []
  }
}

export async function fetchTopInfluencers(limit = 10): Promise<TopInfluencer[]> {
  try {
    const { data, error } = await supabase.rpc("admin_top_influencers", {
      p_limit: limit,
    })
    if (error) {
      console.warn("admin_top_influencers RPC error:", error.message)
      return []
    }
    const rows = (data ?? []) as Array<{
      user_id: string
      username: string
      display_name: string | null
      gig_completion_count: number
    }>
    return rows.map((r) => ({
      userId: r.user_id,
      username: r.username,
      displayName: r.display_name ?? null,
      gigCompletionCount: Number(r.gig_completion_count ?? 0),
    }))
  } catch (e) {
    console.warn("fetchTopInfluencers failed:", e)
    return []
  }
}
