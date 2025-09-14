export interface PlatformAnalytics {
  overview: OverviewMetrics
  userMetrics: UserMetrics
  applicationMetrics: ApplicationMetrics
  revenueMetrics: RevenueMetrics
  performanceMetrics: PerformanceMetrics
}

export interface OverviewMetrics {
  totalUsers: number
  totalApplications: number
  totalRevenue: number
  activeGigs: number
  userGrowthRate: number
  applicationGrowthRate: number
  revenueGrowthRate: number
}

export interface UserMetrics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userRetentionRate: number
  averageSessionDuration: number
  topCountries: Array<{ country: string; count: number }>
  userSegments: Array<{ segment: string; count: number }>
}

export interface ApplicationMetrics {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  applicationSuccessRate: number
  averageResponseTime: number
  topCategories: Array<{ category: string; count: number }>
  monthlyTrends: Array<{ month: string; applications: number; accepted: number }>
}

export interface RevenueMetrics {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowthRate: number
  averageTransactionValue: number
  topRevenueSources: Array<{ source: string; amount: number }>
  revenueByMonth: Array<{ month: string; revenue: number }>
}

export interface PerformanceMetrics {
  platformUptime: number
  averageResponseTime: number
  errorRate: number
  activeConnections: number
  databasePerformance: DatabasePerformance
  apiPerformance: APIPerformance
}

export interface DatabasePerformance {
  queryTime: number
  connectionCount: number
  slowQueries: number
  indexUsage: number
}

export interface APIPerformance {
  averageResponseTime: number
  requestsPerMinute: number
  errorRate: number
  topEndpoints: Array<{ endpoint: string; requests: number; avgTime: number }>
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface MetricCard {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  icon?: string
  description?: string
}
