"use client"

import React, { useState } from "react"
import { CalendarDays, MapPin, Users, QrCode, RefreshCw, Building2, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDateTime, formatDate } from "@/lib/utils"
import {
  setEventStatus,
  setEventQrCheckin,
  recomputeEventCapacity,
  type EventDetail,
  type EventStatus,
} from "@/data/events"

// Inline confirm dialog — no dependency on Wave-1 shared component
interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm: () => Promise<void>
}

const EVENT_STATUSES: EventStatus[] = ["draft", "active", "upcoming", "ongoing", "completed", "cancelled"]

interface EventDetailViewProps {
  event: EventDetail
  onRefresh: () => void
}

export function EventDetailView({ event, onRefresh }: EventDetailViewProps) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  })

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await confirm.onConfirm()
    } finally {
      setLoading(false)
      setConfirm((c) => ({ ...c, open: false }))
    }
  }

  function promptStatusChange(status: EventStatus) {
    setConfirm({
      open: true,
      title: `Set status to "${status}"?`,
      description: `This will change the event status to "${status}". This action is silent — no push notification will be sent.`,
      onConfirm: async () => {
        await setEventStatus(event.id, status)
        showToast(`Status updated to ${status}`)
        onRefresh()
      },
    })
  }

  function promptDelete() {
    setConfirm({
      open: true,
      title: "Delete this event?",
      description: `"${event.title}" will be soft-deleted. This action cannot be undone from the admin panel.`,
      onConfirm: async () => {
        const { softDeleteEvent } = await import("@/data/events")
        await softDeleteEvent(event.id)
        showToast("Event deleted")
        onRefresh()
      },
    })
  }

  async function handleToggleQr() {
    setLoading(true)
    try {
      await setEventQrCheckin(event.id, !event.qrCheckinEnabled)
      showToast(`QR check-in ${!event.qrCheckinEnabled ? "enabled" : "disabled"}`)
      onRefresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update QR setting", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleRecompute() {
    setLoading(true)
    try {
      await recomputeEventCapacity(event.id)
      showToast("Capacity recomputed")
      onRefresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to recompute capacity", "error")
    } finally {
      setLoading(false)
    }
  }

  const capacityDisplay =
    event.capacity === null
      ? "Unlimited capacity"
      : `${event.capacityUsed}/${event.capacity} filled`

  const availableDisplay =
    event.capacity === null ? null : `${event.availableCapacity ?? 0} available`

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Inline confirm dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">{confirm.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{confirm.description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirm((c) => ({ ...c, open: false }))}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{event.title}</CardTitle>
              {event.businessName && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Building2 className="h-4 w-4" />
                  {event.businessName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={event.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading}>
                    Change status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {EVENT_STATUSES.filter((s) => s !== event.status).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => promptStatusChange(s)}>
                      Set to {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description && (
            <p className="text-sm text-gray-700">{event.description}</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Date &amp; Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateTime(event.eventDateTime)}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-900">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Capacity</p>
                <p className="text-sm font-medium text-gray-900">{capacityDisplay}</p>
                {availableDisplay && (
                  <p className="text-xs text-gray-500">{availableDisplay}</p>
                )}
              </div>
            </div>
          </div>

          {/* QR Check-in toggle */}
          <div className="flex items-center gap-4 rounded-md border border-gray-200 p-3">
            <QrCode className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">QR Check-in</p>
              <p className="text-xs text-gray-500">
                {event.qrCheckinEnabled
                  ? "Attendees can check in via QR code"
                  : "QR check-in is disabled"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={event.qrCheckinEnabled ? "success" : "secondary"}>
                {event.qrCheckinEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleQr}
                disabled={loading}
              >
                {event.qrCheckinEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <span>Created: {formatDate(event.createdAt)}</span>
            <span>Updated: {formatDate(event.updatedAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecompute}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recompute capacity
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={promptDelete}
              disabled={loading}
            >
              Delete event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Attendees ({event.attendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.attendees.length === 0 ? (
            <p className="text-sm text-gray-500">No attendees yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attendee.influencerName ?? "Unknown influencer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied {formatDate(attendee.appliedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={attendee.status} />
                    {attendee.checkinAt ? (
                      <span
                        className="flex items-center gap-1 text-xs text-green-700"
                        title={`Checked in at ${formatDateTime(attendee.checkinAt)}`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Checked in
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-4 w-4" />
                        Not checked in
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
