"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  fetchDeletionRequests,
  restoreUser,
  type DeletionRequest,
} from "@/data/users"
import { formatDate, formatDateTime } from "@/lib/utils"
import { ChevronLeft, Trash2, UserCheck, Clock, AlertTriangle } from "lucide-react"

export default function DeletionRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DeletionRequest | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDeletionRequests()
      setRequests(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deletion requests.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function showSuccess(msg: string) {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 4000)
  }

  async function handleRestore() {
    if (!restoreTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await restoreUser(restoreTarget.userId)
      setRestoreTarget(null)
      showSuccess(`${restoreTarget.displayName ?? restoreTarget.email} has been restored.`)
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to restore user.")
    } finally {
      setActionLoading(false)
    }
  }

  function getDaysRemaining(graceUntil: string | null): number | null {
    if (!graceUntil) return null
    const diff = new Date(graceUntil).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deletion Requests</h1>
        <p className="text-muted-foreground">
          Users who have requested account deletion. Accounts are hard-purged 30 days after
          suspension — restore before the grace period ends to cancel.
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Pending Deletion Requests
            <Badge variant="secondary" className="ml-2">
              {requests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-gray-500 py-8 text-center">Loading requests...</div>
          )}

          {!loading && requests.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center">
              No pending deletion requests.{" "}
              {error === null &&
                "The admin_list_delete_requests RPC may not be deployed yet."}
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => {
                const daysLeft = getDaysRemaining(req.graceUntil)
                const isUrgent = daysLeft !== null && daysLeft <= 3
                return (
                  <div
                    key={req.userId}
                    className="flex items-start justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">
                          {req.displayName ?? (
                            <span className="text-gray-400">No display name</span>
                          )}
                        </span>
                        <span className="text-sm text-gray-500">{req.email}</span>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Requested: {formatDate(req.requestedAt)}
                        </span>
                        {req.deletedAt && (
                          <span>
                            Suspended: {formatDateTime(req.deletedAt)}
                          </span>
                        )}
                        {req.graceUntil && (
                          <span
                            className={
                              isUrgent ? "text-red-600 font-medium" : "text-gray-500"
                            }
                          >
                            Hard-purge: {formatDate(req.graceUntil)}
                            {daysLeft !== null && (
                              <> ({daysLeft > 0 ? `${daysLeft}d left` : "overdue"})</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/users/${req.userId}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreTarget(req)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="Restore User Account"
        description={`Restore ${restoreTarget?.displayName ?? restoreTarget?.email}? This will cancel their deletion request and clear the suspension.`}
        confirmLabel="Restore"
        loading={actionLoading}
        onConfirm={handleRestore}
      />
    </div>
  )
}
