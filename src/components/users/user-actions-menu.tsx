"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, UserX, UserCheck, ShieldCheck, ShieldOff, ChevronRight } from "lucide-react"
import type { AdminUser } from "@/data/users"

const ROLES = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "business", label: "Business" },
  { value: "influencer", label: "Influencer" },
] as const

interface UserActionsMenuProps {
  user: AdminUser
  isSelf: boolean
  onSuspend: () => void
  onRestore: () => void
  onChangeRole: (role: string) => void
  onVerify: (verified: boolean) => void
}

export function UserActionsMenu({
  user,
  isSelf,
  onSuspend,
  onRestore,
  onChangeRole,
  onVerify,
}: UserActionsMenuProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/users/${user.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Suspend / Restore */}
        {user.status === "active" ? (
          <DropdownMenuItem
            onClick={onSuspend}
            disabled={isSelf}
            className="text-red-600 focus:text-red-600"
          >
            <UserX className="mr-2 h-4 w-4" />
            Suspend
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onRestore} disabled={isSelf}>
            <UserCheck className="mr-2 h-4 w-4" />
            Restore
          </DropdownMenuItem>
        )}

        {/* Verify / Unverify */}
        <DropdownMenuItem
          onClick={() => onVerify(!user.verifiedUser)}
          disabled={isSelf}
        >
          {user.verifiedUser ? (
            <>
              <ShieldOff className="mr-2 h-4 w-4" />
              Unverify
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Change Role submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isSelf}>
            <ChevronRight className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {ROLES.map((r) => (
              <DropdownMenuItem
                key={r.value}
                onClick={() => onChangeRole(r.value)}
                disabled={user.role === r.value}
              >
                {r.label}
                {user.role === r.value && (
                  <span className="ml-auto text-xs text-gray-400">current</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
