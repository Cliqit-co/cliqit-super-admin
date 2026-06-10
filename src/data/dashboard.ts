import { supabase } from "@/lib/supabase"

export type DashboardStats = {
  totalInfluencers: number
  pendingReviews: number
  approvedInfluencers: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Counts come from a SECURITY DEFINER RPC guarded by is_super_admin().
    // The deleted_at filter can't run client-side anymore: deleted_at is not
    // column-granted to the authenticated role after the users PII lockdown.
    const { data, error } = await supabase.rpc("admin_influencer_stats")
    if (error) throw error

    const stats = (data ?? {}) as Partial<DashboardStats>
    return {
      totalInfluencers: stats.totalInfluencers ?? 0,
      pendingReviews: stats.pendingReviews ?? 0,
      approvedInfluencers: stats.approvedInfluencers ?? 0,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { totalInfluencers: 0, pendingReviews: 0, approvedInfluencers: 0 }
  }
}
