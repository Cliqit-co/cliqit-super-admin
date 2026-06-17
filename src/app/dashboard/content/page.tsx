"use client"

import * as React from "react"
import { fetchSubmissions, reviewSubmission, ContentSubmission } from "@/data/content-submissions"
import { DataTable } from "@/components/tables/data-table"
import { createSubmissionsColumns } from "@/components/content/submissions-columns"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook"]
const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
]

export default function ContentSubmissionsPage() {
  const [submissions, setSubmissions] = React.useState<ContentSubmission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [platformFilter, setPlatformFilter] = React.useState("")

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<{
    submission: ContentSubmission
    action: "completed" | "rejected"
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = React.useState(false)

  const load = React.useCallback(async (opts?: { status?: string; platform?: string; search?: string }) => {
    setLoading(true)
    try {
      const data = await fetchSubmissions(opts)
      setSubmissions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load({ status: statusFilter || undefined, platform: platformFilter || undefined, search: search || undefined })
  }, [load, statusFilter, platformFilter, search])

  const handleApprove = React.useCallback((submission: ContentSubmission) => {
    setPendingAction({ submission, action: "completed" })
    setConfirmOpen(true)
  }, [])

  const handleReject = React.useCallback((submission: ContentSubmission) => {
    setPendingAction({ submission, action: "rejected" })
    setConfirmOpen(true)
  }, [])

  async function handleConfirmReview() {
    if (!pendingAction) return
    setConfirmLoading(true)
    try {
      await reviewSubmission(pendingAction.submission.id, pendingAction.action, null)
      setConfirmOpen(false)
      setPendingAction(null)
      await load({ status: statusFilter || undefined, platform: platformFilter || undefined, search: search || undefined })
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = React.useMemo(
    () => createSubmissionsColumns(handleApprove, handleReject),
    [handleApprove, handleReject]
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review influencer content submissions across all platforms.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search influencer, URL, platform..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={platformFilter === "" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setPlatformFilter("")}
          >
            All Platforms
          </Button>
          {PLATFORMS.map((p) => (
            <Button
              key={p}
              variant={platformFilter === p ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading submissions...</div>
      ) : (
        <DataTable columns={columns} data={submissions} />
      )}

      {/* Confirm dialog for quick actions from the list */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingAction(null)
        }}
        title={
          pendingAction?.action === "completed"
            ? "Approve Submission"
            : "Reject Submission"
        }
        description="This will notify the influencer of the review decision."
        confirmLabel={pendingAction?.action === "completed" ? "Approve" : "Reject"}
        destructive={pendingAction?.action === "rejected"}
        loading={confirmLoading}
        onConfirm={handleConfirmReview}
      />
    </div>
  )
}
