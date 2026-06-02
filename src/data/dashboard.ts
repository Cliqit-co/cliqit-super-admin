import { supabase } from "@/lib/supabase"

export type DashboardStats = {
  totalInfluencers: number
  pendingReviews: number
  approvedInfluencers: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const baseQuery = () => supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "influencer")
      .is("deleted_at", null)

    const [total, pending, approved] = await Promise.all([
      baseQuery(),
      baseQuery().eq("verified_user", false),
      baseQuery().eq("verified_user", true),
    ])

    return {
      totalInfluencers: total.count ?? 0,
      pendingReviews: pending.count ?? 0,
      approvedInfluencers: approved.count ?? 0,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { totalInfluencers: 0, pendingReviews: 0, approvedInfluencers: 0 }
  }
}
