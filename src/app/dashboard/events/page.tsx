"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/tables/data-table"
import { createEventsColumns } from "@/components/events/events-columns"
import {
  fetchEvents,
  setEventStatus,
  setEventQrCheckin,
  softDeleteEvent,
  type EventSummary,
  type EventStatus,
} from "@/data/events"

const STATUS_OPTIONS: { label: string; value: EventStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm: () => Promise<void>
  loading: boolean
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
    loading: false,
  })

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchEvents({ status: statusFilter, search })
    setEvents(data)
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => {
    load()
  }, [load])

  const filteredEvents = useMemo(() => {
    if (!search) return events
    const q = search.toLowerCase()
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.businessName ?? "").toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q)
    )
  }, [events, search])

  function openConfirm(opts: Omit<ConfirmState, "loading">) {
    setConfirm({ ...opts, loading: false })
  }

  async function handleConfirm() {
    setConfirm((c) => ({ ...c, loading: true }))
    try {
      await confirm.onConfirm()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error")
    } finally {
      setConfirm((c) => ({ ...c, open: false, loading: false }))
    }
  }

  const columns = useMemo(
    () =>
      createEventsColumns({
        onViewDetail: (id) => router.push(`/dashboard/events/${id}`),
        onSetStatus: (id, status) => {
          openConfirm({
            open: true,
            title: `Set status to "${status}"?`,
            description: `This is a silent change — no push notification will be sent to attendees.`,
            onConfirm: async () => {
              await setEventStatus(id, status)
              showToast(`Status set to ${status}`)
              await load()
            },
          })
        },
        onToggleQr: (id, enabled) => {
          openConfirm({
            open: true,
            title: `${enabled ? "Enable" : "Disable"} QR check-in?`,
            description: `QR check-in will be ${enabled ? "enabled" : "disabled"} for this event.`,
            onConfirm: async () => {
              await setEventQrCheckin(id, enabled)
              showToast(`QR check-in ${enabled ? "enabled" : "disabled"}`)
              await load()
            },
          })
        },
        onDelete: (id, title) => {
          openConfirm({
            open: true,
            title: "Delete event?",
            description: `"${title}" will be soft-deleted. This cannot be undone from the admin panel.`,
            onConfirm: async () => {
              await softDeleteEvent(id)
              showToast("Event deleted")
              await load()
            },
          })
        },
      }),
    [router, load]
  )

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

      {/* Confirm dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">{confirm.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{confirm.description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setConfirm((c) => ({ ...c, open: false }))}
                disabled={confirm.loading}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                onClick={handleConfirm}
                disabled={confirm.loading}
              >
                {confirm.loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by title, business, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72 rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus | "")}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => load()}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          Loading events...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredEvents}
          searchKey="title"
          searchPlaceholder="Filter by title..."
        />
      )}
    </div>
  )
}
