"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InfluencerProfile } from "@/data/influencers"

export const influencerColumns: ColumnDef<InfluencerProfile>[] = [
  {
    accessorKey: "avatarUrl",
    header: "",
    cell: ({ row }) => {
      const avatar = row.original.avatarUrl
      return (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
          {avatar ? (
            <Image src={avatar} alt={row.original.username} width={32} height={32} />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.username}</div>
    ),
  },
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <span>
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "emailVerified",
    header: "Verified",
    cell: ({ row }) => (
      <Badge variant={row.original.verifiedUser ? "success" : "secondary"}>{row.original.verifiedUser ? "Yes" : "No"}</Badge>
    ),
    size: 80,
  },
  {
    accessorKey: "acceptedTerms",
    header: "Terms",
    cell: ({ row }) => (
      <Badge variant={row.original.acceptedTerms ? "success" : "secondary"}>{row.original.acceptedTerms ? "Yes" : "No"}</Badge>
    ),
    size: 80,
  },
  {
    accessorKey: "acceptedPrivacy",
    header: "Privacy",
    cell: ({ row }) => (
      <Badge variant={row.original.acceptedPrivacy ? "success" : "secondary"}>{row.original.acceptedPrivacy ? "Yes" : "No"}</Badge>
    ),
    size: 80,
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "audienceSize",
    header: "Audience",
  },
  {
    accessorKey: "niche",
    header: "Niche",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.niche || "-"}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    accessorKey: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const cats = row.original.categories ?? []
      if (!cats.length) return <span>-</span>
      const head = cats.slice(0, 2)
      const extra = cats.length - head.length
      return (
        <div className="flex flex-wrap gap-1">
          {head.map((c) => (
            <Badge key={c} variant="outline" className="capitalize">
              {c}
            </Badge>
          ))}
          {extra > 0 && <span className="text-xs text-muted-foreground">+{extra}</span>}
        </div>
      )
    },
  },
]


