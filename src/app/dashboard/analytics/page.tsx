"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  type PieLabelRenderProps,
} from "recharts"
import { Users, Briefcase, Calendar, FileText } from "lucide-react"
import { subDays, subWeeks, subMonths } from "date-fns"

import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartCard } from "@/components/analytics/chart-card"
import {
  fetchPlatformStats,
  fetchSignupTimeseries,
  fetchTopBusinesses,
  fetchTopInfluencers,
  type PlatformStats,
  type SignupBucket,
  type TopBusiness,
  type TopInfluencer,
} from "@/data/analytics"

// recharts v3 PieLabelRenderProps label renderer
function renderPieLabel(props: PieLabelRenderProps): string {
  const pct = typeof props.percent === "number" ? (props.percent * 100).toFixed(0) : "0"
  return `${props.name ?? ""} ${pct}%`
}

// ---- Color palette ----
const COLOR_PRIMARY = "#9333ea"
const COLOR_SECONDARY = "#2563eb"
const COLOR_MUTED = "#e5e7eb"

const PIE_COLORS_ROLE = [COLOR_PRIMARY, COLOR_SECONDARY, "#10b981"]
const PIE_COLORS_VERIFIED = [COLOR_PRIMARY, COLOR_MUTED]

type TimeBucket = "day" | "week" | "month"

const BUCKET_OPTIONS: { label: string; value: TimeBucket; fromFn: () => Date }[] = [
  { label: "Daily (30d)", value: "day", fromFn: () => subDays(new Date(), 30) },
  { label: "Weekly (12w)", value: "week", fromFn: () => subWeeks(new Date(), 12) },
  { label: "Monthly (12m)", value: "month", fromFn: () => subMonths(new Date(), 12) },
]

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [bucket, setBucket] = useState<TimeBucket>("day")
  const [timeseries, setTimeseries] = useState<SignupBucket[]>([])
  const [timeseriesLoading, setTimeseriesLoading] = useState(true)

  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([])
  const [topInfluencers, setTopInfluencers] = useState<TopInfluencer[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)

  // Load platform stats
  useEffect(() => {
    setStatsLoading(true)
    fetchPlatformStats()
      .then(setStats)
      .finally(() => setStatsLoading(false))
  }, [])

  // Load timeseries on bucket change
  const loadTimeseries = useCallback(
    (b: TimeBucket) => {
      setTimeseriesLoading(true)
      const opt = BUCKET_OPTIONS.find((o) => o.value === b)!
      fetchSignupTimeseries(b, opt.fromFn())
        .then(setTimeseries)
        .finally(() => setTimeseriesLoading(false))
    },
    [],
  )

  useEffect(() => {
    loadTimeseries(bucket)
  }, [bucket, loadTimeseries])

  // Load leaderboards
  useEffect(() => {
    setLeaderboardLoading(true)
    Promise.all([fetchTopBusinesses(10), fetchTopInfluencers(10)]).then(
      ([biz, inf]) => {
        setTopBusinesses(biz)
        setTopInfluencers(inf)
        setLeaderboardLoading(false)
      },
    )
  }, [])

  // ---- Derived chart data ----

  const usersByRoleData = useMemo(
    () =>
      stats
        ? [
            { name: "Influencer", value: stats.usersByRole.influencer },
            { name: "Business", value: stats.usersByRole.business },
            { name: "Super Admin", value: stats.usersByRole.superAdmin },
          ]
        : [],
    [stats],
  )

  const verificationData = useMemo(
    () =>
      stats
        ? [
            { name: "Verified", value: stats.influencerVerification.verified },
            { name: "Unverified", value: stats.influencerVerification.unverified },
          ]
        : [],
    [stats],
  )

  const gigsByStatusData = useMemo(
    () =>
      stats
        ? Object.entries(stats.gigsByStatus).map(([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
          }))
        : [],
    [stats],
  )

  const applicationsFunnelData = useMemo(
    () =>
      stats
        ? [
            { stage: "Applied", count: stats.applicationsFunnel.applied },
            { stage: "Approved", count: stats.applicationsFunnel.approved },
            { stage: "Started", count: stats.applicationsFunnel.started },
            { stage: "Pending Verification", count: stats.applicationsFunnel.verification_pending },
            { stage: "Completed", count: stats.applicationsFunnel.completed },
          ]
        : [],
    [stats],
  )

  const topBizData = useMemo(
    () =>
      topBusinesses.map((b) => ({
        name: b.businessName,
        Gigs: b.gigCount,
        Events: b.eventCount,
      })),
    [topBusinesses],
  )

  const topInfData = useMemo(
    () =>
      topInfluencers.map((i) => ({
        name: i.username || i.displayName || i.userId.slice(0, 8),
        Completions: i.gigCompletionCount,
      })),
    [topInfluencers],
  )

  // KPI totals
  const totalUsers = stats
    ? stats.usersByRole.superAdmin + stats.usersByRole.business + stats.usersByRole.influencer
    : 0
  const totalGigs = stats
    ? Object.values(stats.gigsByStatus).reduce((a, b) => a + b, 0)
    : 0
  const totalEvents = stats
    ? Object.values(stats.eventsByStatus).reduce((a, b) => a + b, 0)
    : 0
  const totalApplications = stats
    ? Object.values(stats.applicationsFunnel).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Platform-wide metrics and trends</p>
      </div>

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} value={totalUsers} label="Total Users" />
        <KpiCard icon={Briefcase} value={totalGigs} label="Total Gigs" />
        <KpiCard icon={Calendar} value={totalEvents} label="Total Events" />
        <KpiCard icon={FileText} value={totalApplications} label="Total Applications" />
      </div>

      {/* ---- Pie charts row ---- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Users by Role"
          loading={statsLoading}
          empty={!statsLoading && usersByRoleData.every((d) => d.value === 0)}
          emptyMessage="No user data yet"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={usersByRoleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={renderPieLabel as unknown as boolean}
              >
                {usersByRoleData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS_ROLE[i % PIE_COLORS_ROLE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Users"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Influencer Verification"
          loading={statsLoading}
          empty={!statsLoading && verificationData.every((d) => d.value === 0)}
          emptyMessage="No influencer data yet"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={verificationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={renderPieLabel as unknown as boolean}
              >
                {verificationData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS_VERIFIED[i % PIE_COLORS_VERIFIED.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Influencers"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---- Signups timeseries ---- */}
      <ChartCard
        title="Signups Over Time"
        description="New user registrations"
        loading={timeseriesLoading}
        empty={!timeseriesLoading && timeseries.length === 0}
        emptyMessage="No signup data for the selected period"
      >
        <div className="mb-3 flex gap-2">
          {BUCKET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBucket(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                bucket === opt.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timeseries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v)
                return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v: string) => {
                const d = new Date(v)
                return isNaN(d.getTime()) ? v : d.toLocaleDateString()
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={COLOR_PRIMARY}
              strokeWidth={2}
              dot={false}
              name="Signups"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ---- Gigs by status ---- */}
      <ChartCard
        title="Gigs by Status"
        loading={statsLoading}
        empty={!statsLoading && gigsByStatusData.every((d) => d.count === 0)}
        emptyMessage="No gig data yet"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gigsByStatusData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={COLOR_PRIMARY} name="Gigs" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ---- Applications funnel (horizontal) ---- */}
      <ChartCard
        title="Applications Funnel"
        description="Conversion through application lifecycle"
        loading={statsLoading}
        empty={!statsLoading && applicationsFunnelData.every((d) => d.count === 0)}
        emptyMessage="No application data yet"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            layout="vertical"
            data={applicationsFunnelData}
            margin={{ top: 4, right: 60, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={130} />
            <Tooltip />
            <Bar dataKey="count" fill={COLOR_SECONDARY} name="Applications" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Conversion labels */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {applicationsFunnelData.map((entry, i) => {
            if (i === 0) return null
            const prev = applicationsFunnelData[i - 1].count
            const pct = prev > 0 ? ((entry.count / prev) * 100).toFixed(0) : "—"
            return (
              <span key={i}>
                {applicationsFunnelData[i - 1].stage} → {entry.stage}:{" "}
                <strong>{pct}%</strong>
              </span>
            )
          })}
        </div>
      </ChartCard>

      {/* ---- Leaderboards ---- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Top Businesses"
          description="By number of gigs and events"
          loading={leaderboardLoading}
          empty={!leaderboardLoading && topBizData.length === 0}
          emptyMessage="No business data yet"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={topBizData}
              margin={{ top: 4, right: 16, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Gigs" stackId="a" fill={COLOR_PRIMARY} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Events" stackId="a" fill={COLOR_SECONDARY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top Influencers"
          description="By gig completions"
          loading={leaderboardLoading}
          empty={!leaderboardLoading && topInfData.length === 0}
          emptyMessage="No influencer data yet"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={topInfData}
              margin={{ top: 4, right: 16, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="Completions" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
