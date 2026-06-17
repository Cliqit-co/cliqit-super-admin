"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventDetailView } from "@/components/events/event-detail"
import { fetchEventDetail, type EventDetail } from "@/data/events"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    const data = await fetchEventDetail(id)
    if (!data) {
      setError("Event not found or failed to load.")
    } else {
      setEvent(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/events")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to events
        </Button>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center text-gray-400">
          Loading event...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && event && (
        <EventDetailView event={event} onRefresh={load} />
      )}
    </div>
  )
}
