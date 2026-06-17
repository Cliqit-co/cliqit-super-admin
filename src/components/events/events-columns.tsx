"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, QrCode, Trash2, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDateTime } from "@/lib/utils"
import type { EventSummary, EventStatus } from "@/data/events"

const EVENT_STATUSES: EventStatus[] = ["draft", "active", "upcoming", "ongoing", "completed", "cancelled"]

interface EventColumnsOptions {
  onSetStatus: (id: string, status: EventStatus) => void
  onToggleQr: (id: string, enabled: boolean) => void
  onDelete: (id: string, title: string) => void
  onViewDetail: (id: string) => void
}

export function createEventsColumns(opts: EventColumnsOptions): ColumnDef<EventSummary>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => opts.onViewDetail(row.original.id)}
          className="font-medium text-left hover:underline text-gray-900 max-w-[200px] truncate block"
          title={row.original.title}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.businessName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, _id, value) => value === "" || row.original.status === value,
    },
    {
      accessorKey: "eventDateTime",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {formatDateTime(row.original.eventDateTime)}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 max-w-[150px] truncate block" title={row.original.location ?? undefined}>
          {row.original.location ?? "—"}
        </span>
      ),
    },
    {
      id: "capacity",
      header: "Capacity",
      cell: ({ row }) => {
        const { capacity, capacityUsed } = row.original
        if (capacity === null) {
          return <Badge variant="secondary">Unlimited</Badge>
        }
        return (
          <span className="text-sm font-mono">
            {capacityUsed}/{capacity}
          </span>
        )
      },
    },
    {
      accessorKey: "availableCapacity",
      header: "Available",
      cell: ({ row }) => {
        const { capacity, availableCapacity } = row.original
        if (capacity === null) return <span className="text-sm text-gray-400">—</span>
        return (
          <span className={`text-sm font-mono ${(availableCapacity ?? 0) === 0 ? "text-red-600" : "text-green-700"}`}>
            {availableCapacity ?? 0}
          </span>
        )
      },
    },
    {
      accessorKey: "qrCheckinEnabled",
      header: "QR Check-in",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <QrCode className={`h-4 w-4 ${row.original.qrCheckinEnabled ? "text-green-600" : "text-gray-300"}`} />
          <span className="text-sm text-gray-600">
            {row.original.qrCheckinEnabled ? "On" : "Off"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const event = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => opts.onViewDetail(event.id)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-400 font-normal">Set status</DropdownMenuLabel>
              {EVENT_STATUSES.filter((s) => s !== event.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => opts.onSetStatus(event.id, s)}>
                  Mark as {s}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => opts.onToggleQr(event.id, !event.qrCheckinEnabled)}
              >
                {event.qrCheckinEnabled ? "Disable" : "Enable"} QR check-in
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => opts.onDelete(event.id, event.title)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
