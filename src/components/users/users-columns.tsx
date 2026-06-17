"use client"

import { ColumnDef } from "@tanstack/react-table"
import { RemoteAvatar } from "@/components/remote-avatar"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { AdminUser } from "@/data/users"
import { UserActionsMenu } from "@/components/users/user-actions-menu"

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <Badge variant="secondary">—</Badge>
  const variants: Record<string, "default" | "secondary" | "info"> = {
    superAdmin: "default",
    business: "info",
    influencer: "secondary",
  }
  return (
    <Badge variant={variants[role] ?? "secondary"}>
      {role === "superAdmin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  )
}

function StatusBadgeUser({ status }: { status: "active" | "suspended" }) {
  return (
    <Badge variant={status === "active" ? "success" : "destructive"}>
      {status === "active" ? "Active" : "Suspended"}
    </Badge>
  )
}

interface UsersColumnsProps {
  currentUserId: string
  onSuspend: (user: AdminUser) => void
  onRestore: (user: AdminUser) => void
  onChangeRole: (user: AdminUser, role: string) => void
  onVerify: (user: AdminUser, verified: boolean) => void
}

export function createUsersColumns({
  currentUserId,
  onSuspend,
  onRestore,
  onChangeRole,
  onVerify,
}: UsersColumnsProps): ColumnDef<AdminUser>[] {
  return [
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => (
        <RemoteAvatar
          src={row.original.avatarUrl}
          alt={row.original.displayName ?? "User"}
          size={32}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 48,
    },
    {
      accessorKey: "displayName",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.displayName ?? <span className="text-gray-400">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "verifiedUser",
      header: "Verified",
      cell: ({ row }) => (
        <Badge variant={row.original.verifiedUser ? "success" : "secondary"}>
          {row.original.verifiedUser ? "Yes" : "No"}
        </Badge>
      ),
      size: 80,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadgeUser status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <UserActionsMenu
          user={row.original}
          isSelf={row.original.id === currentUserId}
          onSuspend={() => onSuspend(row.original)}
          onRestore={() => onRestore(row.original)}
          onChangeRole={(role) => onChangeRole(row.original, role)}
          onVerify={(verified) => onVerify(row.original, verified)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}
