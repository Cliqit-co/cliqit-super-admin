import { UserCheck, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react"

export default function DashboardPage() {
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
          <h3 className="text-2xl font-bold text-gray-900 mb-1">89</h3>
          <p className="text-sm text-gray-600">Awaiting Review</p>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Applied Today:</span>
              <span>12</span>
            </div>
            <div className="flex justify-between">
              <span>This Week:</span>
              <span>45</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Approved</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">67</h3>
          <p className="text-sm text-gray-600">This Month</p>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Today:</span>
              <span>8</span>
            </div>
            <div className="flex justify-between">
              <span>This Week:</span>
              <span>23</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Rejected</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">23</h3>
          <p className="text-sm text-gray-600">This Month</p>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Today:</span>
              <span>3</span>
            </div>
            <div className="flex justify-between">
              <span>This Week:</span>
              <span>7</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Approval Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">78%</h3>
          <p className="text-sm text-gray-600">Last 30 Days</p>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>This Week:</span>
              <span>82%</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <span className="text-green-600">↗ +4%</span>
            </div>
          </div>
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
                <p className="text-xs text-gray-500">89 pending applications</p>
              </div>
            </div>
            <a 
              href="/dashboard/influencers/vetting"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Start Reviewing →
            </a>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm font-medium">Recent Approvals</span>
                <p className="text-xs text-gray-500">8 approved today</p>
              </div>
            </div>
            <a 
              href="/dashboard/influencers/vetting"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All →
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Sarah Johnson approved as influencer</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">New application from Mike Chen</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Emma Davis application rejected</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Alex Rodriguez application submitted</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
