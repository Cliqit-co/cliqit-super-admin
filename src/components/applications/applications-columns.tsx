"use client"

import { ColumnDef } from "@tanstack/react-table"
import { RemoteAvatar } from "@/components/remote-avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDate } from "@/lib/utils"
import type { ApplicationListItem } from "@/data/applications"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

const TARGET_TYPE_VARIANT: Record<string, "default" | "info"> = {
  gig: "default",
  event: "info",
}

export const applicationsColumns: ColumnDef<ApplicationListItem>[] = [
  {
    id: "influencer",
    header: "Influencer",
    cell: ({ row }) => {
      const { influencerName, influencerAvatar } = row.original
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <RemoteAvatar src={influencerAvatar} alt={influencerName ?? "Influencer"} size={32} />
          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {influencerName ?? <span className="text-gray-400 italic">Unknown</span>}
          </span>
        </div>
      )
    },
  },
  {
    id: "business",
    header: "Business",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 truncate max-w-[140px] block">
        {row.original.businessName ?? <span className="text-gray-400 italic">—</span>}
      </span>
    ),
  },
  {
    id: "target",
    header: "Target",
    cell: ({ row }) => {
      const { targetTitle, targetType } = row.original
      return (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <span className="text-sm text-gray-900 truncate max-w-[160px]">
            {targetTitle ?? <span className="text-gray-400 italic">Untitled</span>}
          </span>
          <Badge variant={TARGET_TYPE_VARIANT[targetType] ?? "default"} className="w-fit text-[10px] py-0 px-1.5">
            {targetType === "gig" ? "Gig" : "Event"}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "appliedAt",
    header: "Applied",
    cell: ({ row }) => (
      <span className="text-sm text-gray-500 whitespace-nowrap">
        {formatDate(row.original.appliedAt)}
      </span>
    ),
  },
  {
    id: "slot",
    header: "Slot",
    cell: ({ row }) => {
      const { slotId, targetType } = row.original
      if (targetType === "event") {
        return <span className="text-gray-400 text-xs">—</span>
      }
      return (
        <span className="text-xs text-gray-500 font-mono truncate max-w-[80px] block">
          {slotId ? slotId.slice(0, 8) + "…" : <span className="text-gray-400">No slot</span>}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/applications/${row.original.id}`}>
        <Button size="sm" variant="ghost" className="gap-1">
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </Link>
    ),
  },
]
