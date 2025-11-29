"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, CheckCircle, TrendingUp } from "lucide-react"
import { fetchDashboardStats, type DashboardStats } from "@/data/dashboard"

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInfluencers: 0,
    pendingReviews: 0,
    approvedInfluencers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const approvalRate = stats.totalInfluencers > 0 
    ? Math.round((stats.approvedInfluencers / stats.totalInfluencers) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Cliqit Super Admin Panel</h1>
          <p className="text-xl text-muted-foreground">
            Internal tool for managing the influencer marketing platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Influencer Vetting</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.pendingReviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalInfluencers}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.approvedInfluencers}
              </div>
              <p className="text-xs text-muted-foreground">
                Verified influencers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${approvalRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Of total users
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6">
              Access Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
