"use client"

import * as React from "react"
import { Search, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuditTable } from "@/components/audit/audit-table"
import { fetchAuditLog, fetchAuditActions, type AuditEntry } from "@/data/audit"

const PAGE_LIMIT = 50

const TARGET_TYPES = [
  "user",
  "gig",
  "event",
  "application",
  "business",
  "content_submission",
  "community_post",
]

export default function AuditLogPage() {
  // Filter state
  const [actionFilter, setActionFilter] = React.useState<string>("")
  const [targetTypeFilter, setTargetTypeFilter] = React.useState<string>("")
  const [actorIdFilter, setActorIdFilter] = React.useState<string>("")
  const [fromFilter, setFromFilter] = React.useState<string>("")
  const [toFilter, setToFilter] = React.useState<string>("")
  const [page, setPage] = React.useState(0)

  // Data state
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [actions, setActions] = React.useState<string[]>([])

  // Load distinct actions once
  React.useEffect(() => {
    fetchAuditActions().then(setActions)
  }, [])

  // Load entries whenever filters/page change
  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchAuditLog({
      action: actionFilter || undefined,
      targetType: targetTypeFilter || undefined,
      actorId: actorIdFilter.trim() || undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      page,
      limit: PAGE_LIMIT,
    })
      .then(({ entries, total }) => {
        if (!cancelled) {
          setEntries(entries)
          setTotal(total)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [actionFilter, targetTypeFilter, actorIdFilter, fromFilter, toFilter, page])

  function resetFilters() {
    setActionFilter("")
    setTargetTypeFilter("")
    setActorIdFilter("")
    setFromFilter("")
    setToFilter("")
    setPage(0)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reset page whenever filters change
  function handleActionChange(val: string) {
    setActionFilter(val === "__all__" ? "" : val)
    setPage(0)
  }
  function handleTargetTypeChange(val: string) {
    setTargetTypeFilter(val === "__all__" ? "" : val)
    setPage(0)
  }

  const hasFilters =
    actionFilter || targetTypeFilter || actorIdFilter || fromFilter || toFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only record of all admin and system actions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Action filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Action</label>
          <Select value={actionFilter || "__all__"} onValueChange={handleActionChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target type filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Target type</label>
          <Select
            value={targetTypeFilter || "__all__"}
            onValueChange={handleTargetTypeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {TARGET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actor ID filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Actor ID</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8 w-[220px]"
              placeholder="User UUID…"
              value={actorIdFilter}
              onChange={(e) => {
                setActorIdFilter(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <Input
            type="date"
            className="w-[160px]"
            value={fromFilter}
            onChange={(e) => {
              setFromFilter(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <Input
            type="date"
            className="w-[160px]"
            value={toFilter}
            onChange={(e) => {
              setToFilter(e.target.value)
              setPage(0)
            }}
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="self-end"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <AuditTable
        entries={entries}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
