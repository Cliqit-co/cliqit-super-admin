"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDate } from "@/lib/utils"
import type { Gig, GigStatus } from "@/data/gigs"
import Link from "next/link"

interface GigColumnActions {
  onSetStatus: (gig: Gig, status: GigStatus) => void
  onDelete: (gig: Gig) => void
}

export function getGigsColumns(actions: GigColumnActions): ColumnDef<Gig>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/gigs/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline max-w-[200px] truncate block"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.businessName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "compensationType",
      header: "Comp. Type",
      cell: ({ row }) => (
        <StatusBadge status={row.original.compensationType} />
      ),
    },
    {
      accessorKey: "compensationAmount",
      header: "Amount",
      cell: ({ row }) => {
        const { compensationType, compensationAmount, currency } = row.original
        if (compensationType === "freebie" || compensationType === "barter") {
          return <span className="text-sm text-gray-400">N/A</span>
        }
        if (compensationAmount == null) {
          return <span className="text-sm text-gray-400">N/A</span>
        }
        const sym = currency === "USD" || !currency ? "$" : currency + " "
        return (
          <span className="text-sm font-medium">
            {sym}{compensationAmount.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.city ?? "—"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const gig = row.original
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
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/gigs/${gig.id}`}>View detail</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {gig.status !== "active" && (
                <DropdownMenuItem onClick={() => actions.onSetStatus(gig, "active")}>
                  Set Active
                </DropdownMenuItem>
              )}
              {gig.status !== "draft" && (
                <DropdownMenuItem onClick={() => actions.onSetStatus(gig, "draft")}>
                  Set Draft
                </DropdownMenuItem>
              )}
              {gig.status !== "completed" && (
                <DropdownMenuItem onClick={() => actions.onSetStatus(gig, "completed")}>
                  Set Completed
                </DropdownMenuItem>
              )}
              {gig.status !== "cancelled" && (
                <DropdownMenuItem onClick={() => actions.onSetStatus(gig, "cancelled")}>
                  Set Cancelled
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => actions.onDelete(gig)}
              >
                Delete gig
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
