"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/tables/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { createUsersColumns } from "@/components/users/users-columns"
import {
  fetchUsers,
  fetchUserStats,
  setUserSuspended,
  setUserRole,
  setUserVerified,
  type AdminUser,
  type UserStats,
} from "@/data/users"
import { supabase } from "@/lib/supabase"
import { Users, UserCheck, UserX, ShieldAlert } from "lucide-react"
import type { UserRole } from "@/types/db"

export default function UsersPage() {
  const router = useRouter()
  const [rows, setRows] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("")

  // Confirm dialog state
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<AdminUser | null>(null)
  const [verifyTarget, setVerifyTarget] = useState<{ user: AdminUser; newVal: boolean } | null>(null)
  const [roleTarget, setRoleTarget] = useState<{ user: AdminUser; role: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Load identity
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, statsResult] = await Promise.all([
        fetchUsers({ search, role: roleFilter || undefined, status: statusFilter || undefined }),
        fetchUserStats(),
      ])
      setRows(result.rows)
      setStats(statsResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.")
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  // Client-side verified filter (since RPC may not be deployed yet)
  const filteredRows = useMemo(() => {
    if (!verifiedFilter) return rows
    const want = verifiedFilter === "verified"
    return rows.filter((r) => r.verifiedUser === want)
  }, [rows, verifiedFilter])

  function showSuccess(msg: string) {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  async function handleSuspend() {
    if (!suspendTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserSuspended(suspendTarget.id, true)
      setSuspendTarget(null)
      showSuccess("User suspended.")
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to suspend user.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserSuspended(restoreTarget.id, false)
      setRestoreTarget(null)
      showSuccess("User restored.")
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to restore user.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleVerify() {
    if (!verifyTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserVerified(verifyTarget.user.id, verifyTarget.newVal)
      setVerifyTarget(null)
      showSuccess(verifyTarget.newVal ? "User verified." : "User unverified.")
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update verification.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRoleChange() {
    if (!roleTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserRole(roleTarget.user.id, roleTarget.role as UserRole)
      setRoleTarget(null)
      showSuccess(`Role changed to ${roleTarget.role}.`)
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to change role.")
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo(
    () =>
      createUsersColumns({
        currentUserId: currentUserId ?? "",
        onSuspend: (user) => setSuspendTarget(user),
        onRestore: (user) => setRestoreTarget(user),
        onChangeRole: (user, role) => setRoleTarget({ user, role }),
        onVerify: (user, verified) => setVerifyTarget({ user, newVal: verified }),
      }),
    [currentUserId]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage platform users and their roles.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Influencers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byInfluencer}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Businesses</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byBusiness}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deleted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">Search</label>
              <Input
                placeholder="Name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role</label>
              <select
                className="h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="superAdmin">Super Admin</option>
                <option value="business">Business</option>
                <option value="influencer">Influencer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                className="h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Verified</label>
              <select
                className="h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setRoleFilter("")
                setStatusFilter("")
                setVerifiedFilter("")
              }}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/users/deletion-requests")}
            >
              Deletion Requests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {actionSuccess && (
        <div className="p-3 bg-green-50 border border-green-300 text-green-700 rounded-md text-sm">
          {actionSuccess}
        </div>
      )}
      {(actionError || error) && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
          {actionError ?? error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-sm text-gray-500 py-8 text-center">Loading users...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRows}
              searchKey="displayName"
              searchPlaceholder="Filter by name..."
            />
          )}
          {!loading && filteredRows.length === 0 && rows.length > 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No users match the current filters.
            </p>
          )}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No users found. The admin_list_users RPC may not be deployed yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend User"
        description={`Suspend ${suspendTarget?.displayName ?? suspendTarget?.email}? This soft-deletes their account (recoverable within 30 days).`}
        confirmLabel="Suspend"
        destructive
        loading={actionLoading}
        onConfirm={handleSuspend}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restore User"
        description={`Restore ${restoreTarget?.displayName ?? restoreTarget?.email}?`}
        confirmLabel="Restore"
        loading={actionLoading}
        onConfirm={handleRestore}
      />

      <ConfirmDialog
        open={!!verifyTarget}
        onOpenChange={(open) => !open && setVerifyTarget(null)}
        title={verifyTarget?.newVal ? "Verify User" : "Remove Verification"}
        description={`This will ${verifyTarget?.newVal ? "verify" : "unverify"} ${verifyTarget?.user.displayName ?? verifyTarget?.user.email} and send them a push notification.`}
        confirmLabel={verifyTarget?.newVal ? "Verify" : "Remove"}
        destructive={!verifyTarget?.newVal}
        loading={actionLoading}
        onConfirm={handleVerify}
      />

      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={(open) => !open && setRoleTarget(null)}
        title="Change Role"
        description={`Change ${roleTarget?.user.displayName ?? roleTarget?.user.email}'s role to "${roleTarget?.role}"?`}
        confirmLabel="Change Role"
        loading={actionLoading}
        onConfirm={handleRoleChange}
      />
    </div>
  )
}
