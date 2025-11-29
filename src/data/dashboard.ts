import { graphqlRequest } from "@/lib/graphql-client"
import { QUERY_DASHBOARD_STATS, type DashboardStatsResult } from "./graphql"

export type DashboardStats = {
    totalInfluencers: number
    pendingReviews: number
    approvedInfluencers: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    try {
        const result = await graphqlRequest<DashboardStatsResult>(QUERY_DASHBOARD_STATS)

        return {
            totalInfluencers: result.influencer_profiles_aggregate.aggregate.count,
            pendingReviews: result.user_acceptance_aggregate.aggregate.count,
            approvedInfluencers: result.user_acceptance_approved.aggregate.count,
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        return {
            totalInfluencers: 0,
            pendingReviews: 0,
            approvedInfluencers: 0,
        }
    }
}
