"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import {
  fetchSlotChangeRequests,
  resolveSlotChangeRequest,
  type SlotChangeRequest,
} from "@/data/slot-change-requests"
import type { SlotChangeStatus } from "@/types/db"
import { DataTable } from "@/components/tables/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { createSlotChangeColumns } from "@/components/slot-changes/slot-change-columns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Status filter tabs ────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: SlotChangeStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
]

// ── Inline toast ──────────────────────────────────────────────────────────────

type ToastMsg = { msg: string; type: "success" | "error" } | null

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SlotChangesPage() {
  const [requests, setRequests] = React.useState<SlotChangeRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<
    SlotChangeStatus | "all"
  >("pending")
  const [toastMsg, setToastMsg] = React.useState<ToastMsg>(null)

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmLoading, setConfirmLoading] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<{
    req: SlotChangeRequest
    resolution: "approved" | "rejected"
  } | null>(null)

  function showToast(msg: string, type: "success" | "error") {
    setToastMsg({ msg, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Load requests
  React.useEffect(() => {
    setLoading(true)
    const status =
      statusFilter === "all" ? undefined : (statusFilter as SlotChangeStatus)
    fetchSlotChangeRequests(status)
      .then(setRequests)
      .catch((err) => {
        console.error(err)
        showToast("Failed to load slot change requests", "error")
      })
      .finally(() => setLoading(false))
  }, [statusFilter])

  // Handlers
  function handleApprove(req: SlotChangeRequest) {
    setPendingAction({ req, resolution: "approved" })
    setConfirmOpen(true)
  }

  function handleReject(req: SlotChangeRequest) {
    setPendingAction({ req, resolution: "rejected" })
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    if (!pendingAction) return
    setConfirmLoading(true)
    try {
      await resolveSlotChangeRequest(
        pendingAction.req.id,
        pendingAction.resolution
      )
      showToast(
        `Request ${pendingAction.resolution === "approved" ? "approved" : "rejected"} successfully.`,
        "success"
      )
      const status =
        statusFilter === "all" ? undefined : (statusFilter as SlotChangeStatus)
      const updated = await fetchSlotChangeRequests(status)
      setRequests(updated)
      setConfirmOpen(false)
      setPendingAction(null)
    } catch (err) {
      console.error(err)
      showToast(
        err instanceof Error ? err.message : "Failed to resolve request",
        "error"
      )
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = React.useMemo(
    () => createSlotChangeColumns(handleApprove, handleReject),
    []
  )

  // Confirm dialog copy
  const isApproval = pendingAction?.resolution === "approved"
  const isFullSlot =
    isApproval && pendingAction?.req.requestedSlot?.capacityReached === true

  const confirmTitle = isFullSlot
    ? "⚠ Requested slot is at full capacity — still approve?"
    : isApproval
      ? "Approve Slot Change Request"
      : "Reject Slot Change Request"

  const confirmDescription = isFullSlot
    ? "Approving will over-fill the requested slot. The slot capacity has already been reached. Are you sure you want to proceed?"
    : isApproval
      ? "Approve this influencer's request to switch to the new slot? The trigger will move their application automatically."
      : "Reject this slot change request? The influencer will remain in their current slot."

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Slot Change Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and resolve influencer requests to change their gig slot.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full",
              statusFilter === f.value && "shadow-sm"
            )}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          searchKey="requester"
          searchPlaceholder="Search by requester…"
        />
      )}

      {/* Inline toast */}
      {toastMsg && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg",
            toastMsg.type === "success" ? "bg-green-600" : "bg-red-600"
          )}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toastMsg.msg}
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false)
            setPendingAction(null)
          }
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={
          isFullSlot ? "Approve anyway" : isApproval ? "Approve" : "Reject"
        }
        destructive={!isApproval || isFullSlot}
        loading={confirmLoading}
        onConfirm={handleConfirm}
      />

      {/* Full-slot warning hint in table area */}
      {!loading && requests.some((r) => r.status === "pending" && r.requestedSlot?.capacityReached) && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Some pending requests target a slot that is already at full capacity. These are flagged{" "}
          <span className="font-semibold">Full</span> in the table.
        </div>
      )}
    </div>
  )
}
