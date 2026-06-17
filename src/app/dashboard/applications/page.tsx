"use client"

import { useEffect, useMemo, useState } from "react"
import { DataTable } from "@/components/tables/data-table"
import { applicationsColumns } from "@/components/applications/applications-columns"
import { fetchApplications, type ApplicationListItem, type ApplicationStatus, type TargetType } from "@/data/applications"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const STATUS_OPTIONS: { label: string; value: ApplicationStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Applied", value: "applied" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Withdrawn", value: "withdrawn" },
  { label: "Started", value: "started" },
  { label: "Verification Pending", value: "verification_pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

const TARGET_TYPE_OPTIONS: { label: string; value: TargetType | "" }[] = [
  { label: "All types", value: "" },
  { label: "Gig", value: "gig" },
  { label: "Event", value: "event" },
]

export default function ApplicationsPage() {
  const [data, setData] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("")
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetType | "">("")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchApplications({
        status: statusFilter || undefined,
        targetType: targetTypeFilter || undefined,
        search: search || undefined,
      })
      setData(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, targetTypeFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (r) =>
        (r.influencerName ?? "").toLowerCase().includes(q) ||
        (r.businessName ?? "").toLowerCase().includes(q) ||
        (r.targetTitle ?? "").toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading…" : `${filtered.length} application${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search influencer, business, target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value as TargetType | "")}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TARGET_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {(statusFilter || targetTypeFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("")
              setTargetTypeFilter("")
              setSearch("")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={applicationsColumns}
        data={filtered}
        searchKey={undefined}
      />
    </div>
  )
}
