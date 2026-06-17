"use client"

import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/utils"
import {
  fetchNotificationHistory,
  fetchNotificationTypes,
  type NotificationHistoryRow,
} from "@/data/notification-history"
import type { NotificationType } from "@/types/db"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_LIMIT = 50

export default function NotificationHistoryPage() {
  const [rows, setRows] = useState<NotificationHistoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Filters
  const [successFilter, setSuccessFilter] = useState<"all" | "success" | "failed">("failed")
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all")
  const [userIdFilter, setUserIdFilter] = useState("")
  const [availableTypes, setAvailableTypes] = useState<NotificationType[]>([])

  // Detail dialog
  const [selectedRow, setSelectedRow] = useState<NotificationHistoryRow | null>(null)

  useEffect(() => {
    fetchNotificationTypes().then(setAvailableTypes).catch(console.error)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchNotificationHistory({
        success: successFilter === "all" ? undefined : successFilter === "success",
        type: typeFilter === "all" ? undefined : typeFilter,
        userId: userIdFilter.trim() || undefined,
        page,
        limit: PAGE_LIMIT,
      })
      setRows(result.rows)
      setTotal(result.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [successFilter, typeFilter, userIdFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  function handleFilterChange() {
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={successFilter}
            onValueChange={(v) => {
              setSuccessFilter(v as typeof successFilter)
              handleFilterChange()
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="failed">Failed only</SelectItem>
              <SelectItem value="success">Succeeded only</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as typeof typeFilter)
              handleFilterChange()
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {availableTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">User ID</Label>
          <Input
            className="w-64"
            placeholder="Filter by user UUID..."
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value)
              handleFilterChange()
            }}
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Body</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No records found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedRow(row)}
                >
                  <td className="p-3">
                    <div className="font-mono text-xs text-muted-foreground">
                      {row.user?.display_name ?? row.user_id ?? "—"}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {row.notification_type}
                    </Badge>
                  </td>
                  <td className="p-3 max-w-[160px] truncate">{row.title ?? "—"}</td>
                  <td className="p-3 max-w-[200px] truncate text-muted-foreground">
                    {row.body ?? "—"}
                  </td>
                  <td className="p-3">
                    {row.success ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Success
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="destructive">Failed</Badge>
                        {row.error_message && (
                          <p className="text-xs text-red-600 max-w-[180px] truncate">
                            {row.error_message}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">
                    {formatDateTime(row.sent_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} total record{total !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row detail dialog */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Notification Detail</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    User
                  </p>
                  <p>{selectedRow.user?.display_name ?? selectedRow.user_id ?? "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Type
                  </p>
                  <Badge variant="outline">{selectedRow.notification_type}</Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Title
                  </p>
                  <p>{selectedRow.title ?? "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Sent At
                  </p>
                  <p>{formatDateTime(selectedRow.sent_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Body
                  </p>
                  <p>{selectedRow.body ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </p>
                  {selectedRow.success ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Success
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <Badge variant="destructive">Failed</Badge>
                      {selectedRow.error_message && (
                        <p className="text-red-600 mt-1">{selectedRow.error_message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {selectedRow.data && (
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">
                    Data (JSON)
                  </p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedRow.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
