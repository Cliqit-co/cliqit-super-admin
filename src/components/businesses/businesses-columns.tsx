"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { type BusinessProfile } from "@/data/businesses"
import { formatDate } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

export const businessColumns: ColumnDef<BusinessProfile>[] = [
  {
    id: "logo",
    header: "",
    cell: ({ row }) => (
      <RemoteAvatar
        src={row.original.logoUrl}
        alt={row.original.businessName ?? "Business"}
        size={36}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "businessName",
    header: "Business",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.businessName ?? <span className="text-muted-foreground italic">Unnamed</span>}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.original.category
      return cat ? (
        <Badge variant="secondary" className="capitalize">{cat}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => row.original.city ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "verifiedAt",
    header: "Verified",
    cell: ({ row }) => {
      const v = row.original.verifiedAt
      return v ? (
        <Badge variant="success">Verified</Badge>
      ) : (
        <Badge variant="secondary">Unverified</Badge>
      )
    },
    size: 100,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.email ?? "—"}</span>
    ),
  },
  {
    id: "suspended",
    header: "Status",
    cell: ({ row }) => {
      const suspended = !!row.original.userDeletedAt
      return suspended ? (
        <Badge variant="destructive">Suspended</Badge>
      ) : (
        <Badge variant="outline" className="text-green-700 border-green-300">Active</Badge>
      )
    },
    size: 90,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/businesses/${row.original.userId}`}>
        <Button variant="ghost" size="sm" className="gap-1">
          <ExternalLink className="h-3.5 w-3.5" />
          View
        </Button>
      </Link>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 70,
  },
]
