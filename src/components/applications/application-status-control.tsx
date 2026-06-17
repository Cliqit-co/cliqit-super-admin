"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { cn } from "@/lib/utils"
import {
  APPLICATION_TRANSITIONS,
  isValidTransition,
  setApplicationStatus,
  type ApplicationStatus,
} from "@/data/applications"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"

const ALL_STATUSES: ApplicationStatus[] = [
  "applied",
  "approved",
  "rejected",
  "withdrawn",
  "started",
  "verification_pending",
  "completed",
  "cancelled",
]

function statusLabel(s: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    applied: "Applied",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    started: "Started",
    verification_pending: "Verification Pending",
    completed: "Completed",
    cancelled: "Cancelled",
  }
  return map[s]
}

interface ApplicationStatusControlProps {
  applicationId: string
  currentStatus: ApplicationStatus
  onStatusChanged: (newStatus: ApplicationStatus) => void
}

export function ApplicationStatusControl({
  applicationId,
  currentStatus,
  onStatusChanged,
}: ApplicationStatusControlProps) {
  const [forceOpen, setForceOpen] = React.useState(false)
  const [pending, setPending] = React.useState<ApplicationStatus | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const guidedTransitions = APPLICATION_TRANSITIONS[currentStatus] ?? []
  const isTerminal = guidedTransitions.length === 0

  async function executeChange(newStatus: ApplicationStatus) {
    setLoading(true)
    setError(null)
    try {
      await setApplicationStatus(applicationId, newStatus)
      onStatusChanged(newStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setLoading(false)
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Guided transitions */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Valid next statuses
        </p>
        {isTerminal ? (
          <p className="text-sm text-gray-400 italic">This application is in a terminal state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {guidedTransitions.map((next) => (
              <Button
                key={next}
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => setPending(next)}
                className="gap-1.5"
              >
                <StatusBadge status={next} />
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Force override section */}
      <div className="border border-yellow-200 rounded-lg bg-yellow-50">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setForceOpen((p) => !p)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <span className="text-sm font-medium text-yellow-800">Force override</span>
          </div>
          {forceOpen ? (
            <ChevronUp className="h-4 w-4 text-yellow-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-yellow-600" />
          )}
        </button>

        {forceOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-yellow-200">
            <p className="text-xs text-yellow-700 mt-3">
              Bypasses flow validation. Still sends a push notification to the influencer.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.filter((s) => s !== currentStatus).map((next) => {
                const isValid = isValidTransition(currentStatus, next)
                return (
                  <Button
                    key={next}
                    size="sm"
                    variant={isValid ? "outline" : "ghost"}
                    disabled={loading}
                    onClick={() => setPending(next)}
                    className={cn(
                      "gap-1.5 text-xs",
                      !isValid && "opacity-70 border-dashed border-yellow-400",
                    )}
                  >
                    {statusLabel(next)}
                    {!isValid && (
                      <span className="text-[10px] text-yellow-600 font-normal">(force)</span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Confirm dialog — gated because every change fires notify-gig-activity */}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={`Change status to "${pending ? statusLabel(pending) : ""}"`}
        description={`Changing this status will send a push notification to the influencer. Are you sure you want to set this application to "${pending ? statusLabel(pending) : ""}"?`}
        confirmLabel="Yes, change status"
        loading={loading}
        onConfirm={() => pending && executeChange(pending)}
      />
    </div>
  )
}
