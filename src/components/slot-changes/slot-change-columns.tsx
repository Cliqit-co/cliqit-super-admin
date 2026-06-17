"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { cn, formatDateTime } from "@/lib/utils"
import type { SlotChangeRequest } from "@/data/slot-change-requests"

// ── Slot display helper ───────────────────────────────────────────────────────

function SlotCell({
  slot,
  showCapacityWarning,
}: {
  slot: { slotStart: string; slotEnd: string; capacity: number; capacityReached: boolean } | null
  showCapacityWarning?: boolean
}) {
  if (!slot) return <span className="text-muted-foreground text-xs">—</span>

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <span className="text-xs font-medium">{formatDateTime(slot.slotStart)}</span>
      <span className="text-xs text-muted-foreground">to {formatDateTime(slot.slotEnd)}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          Capacity: {slot.capacity}
        </span>
        {showCapacityWarning && slot.capacityReached && (
          <Badge variant="destructive" className="flex items-center gap-1 text-[10px] py-0 px-1.5 h-4">
            <AlertTriangle className="h-2.5 w-2.5" />
            Full
          </Badge>
        )}
      </div>
    </div>
  )
}

// ── Column factory ────────────────────────────────────────────────────────────

export function createSlotChangeColumns(
  onApprove: (req: SlotChangeRequest) => void,
  onReject: (req: SlotChangeRequest) => void
): ColumnDef<SlotChangeRequest>[] {
  return [
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => {
        const req = row.original
        return (
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <span className="text-sm font-medium">
              {req.requester?.displayName ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {req.requester?.id ?? ""}
            </span>
          </div>
        )
      },
    },
    {
      id: "gig",
      header: "Gig",
      cell: ({ row }) => {
        const title = row.original.gigTitle
        return title ? (
          <span className="text-sm font-medium">{title}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "from_slot",
      header: "Current Slot",
      cell: ({ row }) => <SlotCell slot={row.original.fromSlot} />,
    },
    {
      id: "requested_slot",
      header: "Requested Slot",
      cell: ({ row }) => (
        <SlotCell slot={row.original.requestedSlot} showCapacityWarning />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.reason
        return reason ? (
          <span
            className="text-sm max-w-[200px] block truncate"
            title={reason}
          >
            {reason}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "created_at",
      header: "Requested At",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const req = row.original
        if (req.status !== "pending") return null
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className={cn(
                req.requestedSlot?.capacityReached &&
                  "bg-amber-600 hover:bg-amber-700"
              )}
              onClick={() => onApprove(req)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(req)}
            >
              Reject
            </Button>
          </div>
        )
      },
    },
  ]
}
