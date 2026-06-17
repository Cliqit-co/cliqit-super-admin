"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserX,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
} from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
  fetchUser,
  setUserSuspended,
  setUserRole,
  setUserVerified,
  type AdminUserDetail,
} from "@/data/users"
import type { UserRole } from "@/types/db"

interface AuditEntry {
  id: string
  action: string
  target_type: string
  target_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  actor: { display_name: string | null } | null
}

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Audit log state
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  // Confirm dialogs
  const [suspendDialog, setSuspendDialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; newVal: boolean }>({
    open: false,
    newVal: false,
  })
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; newRole: UserRole | null }>({
    open: false,
    newRole: null,
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Load current user identity
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  // Load user detail
  const loadUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const u = await fetchUser(userId)
      if (!u) setError("User not found.")
      else setUser(u)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user.")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Load audit log for this user as target
  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    try {
      const { data } = await supabase
        .from("audit_log")
        .select(
          "id, action, target_type, target_id, before, after, created_at, actor:users_public!actor_id(display_name)"
        )
        .eq("target_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      setAuditEntries((data ?? []) as unknown as AuditEntry[])
    } catch {
      // silently fail
    } finally {
      setAuditLoading(false)
    }
  }, [userId])

  const isSelf = currentUserId === userId

  function showSuccess(msg: string) {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  async function handleSuspend() {
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserSuspended(userId, true)
      setSuspendDialog(false)
      showSuccess("User suspended.")
      await loadUser()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to suspend user.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRestore() {
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserSuspended(userId, false)
      setRestoreDialog(false)
      showSuccess("User restored.")
      await loadUser()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to restore user.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleVerify() {
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserVerified(userId, verifyDialog.newVal)
      setVerifyDialog({ open: false, newVal: false })
      showSuccess(verifyDialog.newVal ? "User verified." : "User unverified.")
      await loadUser()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update verification.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRoleChange() {
    if (!roleDialog.newRole) return
    setActionLoading(true)
    setActionError(null)
    try {
      await setUserRole(userId, roleDialog.newRole)
      setRoleDialog({ open: false, newRole: null })
      showSuccess(`Role changed to ${roleDialog.newRole}.`)
      await loadUser()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to change role.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading user...</div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-8 text-center text-red-600">{error ?? "User not found."}</div>
    )
  }

  const isSuspended = user.status === "suspended"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <RemoteAvatar src={user.avatarUrl} alt={user.displayName ?? "User"} size={64} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {user.displayName ?? <span className="text-gray-400">No display name</span>}
          </h1>
          <p className="text-gray-500">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {user.role && (
              <Badge variant="default">
                {user.role === "superAdmin" ? "Super Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            )}
            <Badge variant={isSuspended ? "destructive" : "success"}>
              {isSuspended ? "Suspended" : "Active"}
            </Badge>
            <Badge variant={user.verifiedUser ? "success" : "secondary"}>
              {user.verifiedUser ? "Verified" : "Unverified"}
            </Badge>
            <Badge variant={user.emailVerified ? "success" : "warning"}>
              {user.emailVerified ? "Email Confirmed" : "Email Unconfirmed"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action feedback */}
      {actionSuccess && (
        <div className="p-3 bg-green-50 border border-green-300 text-green-700 rounded-md text-sm">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
          {actionError}
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity" onClick={loadAudit}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </dt>
                    <dd className="font-medium mt-0.5">{user.email}</dd>
                  </div>
                  {user.phoneNumber && (
                    <div>
                      <dt className="text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </dt>
                      <dd className="font-medium mt-0.5">
                        {user.phoneNumber}
                        {user.phoneNumberVerified && (
                          <Badge variant="success" className="ml-2 text-xs">verified</Badge>
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined
                    </dt>
                    <dd className="font-medium mt-0.5">{formatDate(user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Role</dt>
                    <dd className="mt-0.5">
                      {user.role ?? <span className="text-gray-400">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Onboarding</dt>
                    <dd className="mt-0.5">
                      <Badge variant={user.onboardingCompleted ? "success" : "secondary"}>
                        {user.onboardingCompleted ? "Completed" : "Incomplete"}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Terms & Privacy</dt>
                    <dd className="mt-0.5 flex gap-1 flex-wrap">
                      <Badge variant={user.acceptedTerms ? "success" : "warning"}>
                        {user.acceptedTerms ? "Terms ✓" : "Terms ✗"}
                      </Badge>
                      <Badge variant={user.acceptedPrivacy ? "success" : "warning"}>
                        {user.acceptedPrivacy ? "Privacy ✓" : "Privacy ✗"}
                      </Badge>
                    </dd>
                  </div>
                  {user.deletedAt && (
                    <div className="md:col-span-2">
                      <dt className="text-red-500">Suspended At</dt>
                      <dd className="font-medium mt-0.5">{formatDateTime(user.deletedAt)}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Activity counts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{user.counts.gigs}</div>
                    <div className="text-xs text-gray-500">Gigs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.counts.events}</div>
                    <div className="text-xs text-gray-500">Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.counts.applications}</div>
                    <div className="text-xs text-gray-500">Applications</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Influencer profile sub-card */}
            {user.influencerProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Influencer Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium">
                        {[user.influencerProfile.firstName, user.influencerProfile.lastName]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Username</dt>
                      <dd className="font-medium">
                        {user.influencerProfile.username
                          ? `@${user.influencerProfile.username}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">City</dt>
                      <dd>{user.influencerProfile.city ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Niche</dt>
                      <dd>{user.influencerProfile.niche ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Audience Size</dt>
                      <dd>{user.influencerProfile.audienceSize ?? "—"}</dd>
                    </div>
                    {user.influencerProfile.categories?.length ? (
                      <div className="md:col-span-2">
                        <dt className="text-gray-500">Categories</dt>
                        <dd className="flex flex-wrap gap-1 mt-1">
                          {user.influencerProfile.categories.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs capitalize">
                              {c}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    ) : null}
                    {user.influencerProfile.bio && (
                      <div className="md:col-span-2">
                        <dt className="text-gray-500">Bio</dt>
                        <dd className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">
                          {user.influencerProfile.bio}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Business profile sub-card */}
            {user.businessProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Business Name</dt>
                      <dd className="font-medium">{user.businessProfile.businessName ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Category</dt>
                      <dd>{user.businessProfile.businessCategory ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">City</dt>
                      <dd>{user.businessProfile.city ?? "—"}</dd>
                    </div>
                    {user.businessProfile.website && (
                      <div>
                        <dt className="text-gray-500">Website</dt>
                        <dd>
                          <a
                            href={user.businessProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.businessProfile.website}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="mt-4 space-y-3">
            {auditLoading && (
              <p className="text-sm text-gray-500">Loading audit log...</p>
            )}
            {!auditLoading && auditEntries.length === 0 && (
              <p className="text-sm text-gray-500">No audit entries found for this user.</p>
            )}
            {auditEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-sm">{entry.action}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        target: {entry.target_type}
                      </span>
                      {entry.actor?.display_name && (
                        <span className="text-xs text-gray-400 ml-2">
                          by {entry.actor.display_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {(entry.before || entry.after) && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer">
                        View diff
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-auto max-h-40">
                        {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger">
          <div className="mt-4 space-y-4">
            {isSelf && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                You cannot modify your own account from this panel.
              </div>
            )}

            {/* Suspend / Restore */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-700 flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Suspend / Restore User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Suspending a user sets their <code>deleted_at</code> timestamp (reversible).
                  A 30-day cron will hard-purge suspended accounts — restore before then to cancel.
                  This does <strong>not</strong> invalidate existing auth sessions.
                </p>
                <div className="flex gap-3">
                  {isSuspended ? (
                    <Button
                      variant="outline"
                      disabled={isSelf}
                      onClick={() => setRestoreDialog(true)}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Restore User
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      disabled={isSelf}
                      onClick={() => setSuspendDialog(true)}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Suspend User
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verify / Unverify */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Toggling verified status sends a push notification to the user.
                </p>
                <Button
                  variant="outline"
                  disabled={isSelf}
                  onClick={() =>
                    setVerifyDialog({ open: true, newVal: !user.verifiedUser })
                  }
                >
                  {user.verifiedUser ? (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Remove Verification
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Mark as Verified
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Change Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Change Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Current role: <strong>{user.role ?? "none"}</strong>. Cannot demote the last
                  super admin — the database will reject it with a friendly error.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["superAdmin", "business", "influencer"] as UserRole[]).map((r) => (
                    <Button
                      key={r}
                      variant={user.role === r ? "default" : "outline"}
                      size="sm"
                      disabled={isSelf || user.role === r}
                      onClick={() => setRoleDialog({ open: true, newRole: r })}
                    >
                      {r === "superAdmin" ? "Super Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service-role ops note */}
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Operations Requiring Service Role Key
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  The following actions require the Supabase service role key (never exposed to the
                  browser). Use the{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Supabase Dashboard
                  </a>{" "}
                  or an edge function:
                </p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-500 space-y-1">
                  <li>Create user (auth.admin.createUser)</li>
                  <li>Hard-delete user (auth.admin.deleteUser)</li>
                  <li>Reset password (auth.admin.generateLink)</li>
                  <li>Confirm email (auth.admin.updateUserById)</li>
                  <li>Ban / unban user (auth.admin.updateUserById)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={suspendDialog}
        onOpenChange={setSuspendDialog}
        title="Suspend User"
        description={`Are you sure you want to suspend ${user.displayName ?? user.email}? Their account will be soft-deleted (recoverable within 30 days).`}
        confirmLabel="Suspend"
        destructive
        loading={actionLoading}
        onConfirm={handleSuspend}
      />

      <ConfirmDialog
        open={restoreDialog}
        onOpenChange={setRestoreDialog}
        title="Restore User"
        description={`Restore ${user.displayName ?? user.email}? This will clear their suspended status.`}
        confirmLabel="Restore"
        loading={actionLoading}
        onConfirm={handleRestore}
      />

      <ConfirmDialog
        open={verifyDialog.open}
        onOpenChange={(open) => setVerifyDialog((d) => ({ ...d, open }))}
        title={verifyDialog.newVal ? "Verify User" : "Remove Verification"}
        description={`This will ${verifyDialog.newVal ? "verify" : "unverify"} ${user.displayName ?? user.email} and send them a push notification.`}
        confirmLabel={verifyDialog.newVal ? "Verify" : "Remove Verification"}
        destructive={!verifyDialog.newVal}
        loading={actionLoading}
        onConfirm={handleVerify}
      />

      <ConfirmDialog
        open={roleDialog.open}
        onOpenChange={(open) => setRoleDialog((d) => ({ ...d, open }))}
        title="Change Role"
        description={`Change ${user.displayName ?? user.email}'s role to "${roleDialog.newRole}"? This is a silent action (no push notification).`}
        confirmLabel="Change Role"
        loading={actionLoading}
        onConfirm={handleRoleChange}
      />
    </div>
  )
}
