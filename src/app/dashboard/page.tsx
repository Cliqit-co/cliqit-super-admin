"use client"

import { useEffect, useState } from "react"
import { UserCheck, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import { fetchDashboardStats, type DashboardStats } from "@/data/dashboard"
import Link from "next/link"

export default function DashboardPage() {
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome back 👋</h1>
        <p className="text-xl opacity-90">Review and manage influencer applications</p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.pendingReviews}
          </h3>
          <p className="text-sm text-gray-600">Awaiting Review</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Approved</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.approvedInfluencers}
          </h3>
          <p className="text-sm text-gray-600">Total Approved</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Influencers</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.totalInfluencers}
          </h3>
          <p className="text-sm text-gray-600">Registered</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-gray-600" />
            </div>
            <span className="text-sm text-gray-500">Approval Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : `${approvalRate}%`}
          </h3>
          <p className="text-sm text-gray-600">Of Total Users</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium">Review Applications</span>
                <p className="text-xs text-gray-500">
                  {loading ? "..." : `${stats.pendingReviews} pending applications`}
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/influencers/vetting"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Start Reviewing →
            </Link>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm font-medium">Approved Influencers</span>
                <p className="text-xs text-gray-500">
                  {loading ? "..." : `${stats.approvedInfluencers} approved users`}
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/influencers/vetting?filter=verified"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
