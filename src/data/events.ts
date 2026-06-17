import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ---- enum types (inline until types/db.ts lands in Wave 1) ----
export type EventStatus =
  | "draft"
  | "active"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"

export type ApplicationStatus =
  | "applied"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "started"
  | "verification_pending"
  | "completed"
  | "cancelled"

// ---- DB row shapes ----
interface EventsWithCapacityRow {
  id: string
  business_id: string
  title: string
  description: string | null
  event_date_time: string
  location: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  capacity_used: number
  cover_image: string | null
  status: EventStatus
  qr_checkin_enabled: boolean
  requirements: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  available_capacity: number | null
  // joined
  users?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface ApplicationRow {
  id: string
  target_type: string
  target_id: string
  influencer_id: string
  business_id: string
  slot_id: string | null
  status: ApplicationStatus
  application_message: string | null
  applied_at: string
  checkin_at: string | null
  status_changed_at: string | null
  started_at: string | null
  created_at: string
  updated_at: string
  users?: {
    id: string
    display_name: string | null
  } | null
}

// ---- Public TS types ----
export type EventSummary = {
  id: string
  businessId: string
  businessName: string | null
  title: string
  description: string | null
  eventDateTime: string
  location: string | null
  capacity: number | null
  capacityUsed: number
  availableCapacity: number | null
  coverImage: string | null
  status: EventStatus
  qrCheckinEnabled: boolean
  requirements: Record<string, unknown> | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EventAttendee = {
  id: string
  influencerId: string
  influencerName: string | null
  status: ApplicationStatus
  applicationMessage: string | null
  appliedAt: string
  checkinAt: string | null
  statusChangedAt: string | null
  startedAt: string | null
  createdAt: string
}

export type EventDetail = EventSummary & {
  attendees: EventAttendee[]
}

// ---- Query params ----
export interface FetchEventsParams {
  status?: EventStatus | ""
  search?: string
}

// ---- Data functions ----

export async function fetchEvents(params: FetchEventsParams = {}): Promise<EventSummary[]> {
  try {
    let query = supabase
      .from("events_with_capacity")
      .select("*, users!business_id(id, display_name, avatar_url)")
      .is("deleted_at", null)
      .order("event_date_time", { ascending: false })

    if (params.status) {
      query = query.eq("status", params.status)
    }

    if (params.search) {
      query = query.ilike("title", `%${params.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("fetchEvents error:", error)
      return []
    }

    return (data ?? []).map((row: EventsWithCapacityRow) => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.users?.display_name ?? null,
      title: row.title,
      description: row.description,
      eventDateTime: row.event_date_time,
      location: row.location,
      capacity: row.capacity,
      capacityUsed: row.capacity_used ?? 0,
      availableCapacity: row.available_capacity,
      coverImage: resolveStorageUrl(row.cover_image ?? undefined),
      status: row.status,
      qrCheckinEnabled: row.qr_checkin_enabled ?? false,
      requirements: row.requirements,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (err) {
    console.error("fetchEvents exception:", err)
    return []
  }
}

export async function fetchEventDetail(id: string): Promise<EventDetail | null> {
  try {
    const { data, error } = await supabase
      .from("events_with_capacity")
      .select("*, users!business_id(id, display_name, avatar_url), applications(*, users!influencer_id(id, display_name))")
      .eq("id", id)
      .single()

    if (error) {
      console.error("fetchEventDetail error:", error)
      return null
    }

    if (!data) return null

    const row = data as EventsWithCapacityRow & { applications: ApplicationRow[] }

    const attendees: EventAttendee[] = (row.applications ?? []).map((app: ApplicationRow) => ({
      id: app.id,
      influencerId: app.influencer_id,
      influencerName: app.users?.display_name ?? null,
      status: app.status,
      applicationMessage: app.application_message,
      appliedAt: app.applied_at,
      checkinAt: app.checkin_at,
      statusChangedAt: app.status_changed_at,
      startedAt: app.started_at,
      createdAt: app.created_at,
    }))

    return {
      id: row.id,
      businessId: row.business_id,
      businessName: row.users?.display_name ?? null,
      title: row.title,
      description: row.description,
      eventDateTime: row.event_date_time,
      location: row.location,
      capacity: row.capacity,
      capacityUsed: row.capacity_used ?? 0,
      availableCapacity: row.available_capacity,
      coverImage: resolveStorageUrl(row.cover_image ?? undefined),
      status: row.status,
      qrCheckinEnabled: row.qr_checkin_enabled ?? false,
      requirements: row.requirements,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attendees,
    }
  } catch (err) {
    console.error("fetchEventDetail exception:", err)
    return null
  }
}

// Silent — no push notification for event status changes
export async function setEventStatus(id: string, status: EventStatus): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", id)

  if (error) throw new Error(`Failed to update event status: ${error.message}`)
}

export async function setEventQrCheckin(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ qr_checkin_enabled: enabled })
    .eq("id", id)

  if (error) throw new Error(`Failed to update QR check-in setting: ${error.message}`)
}

export async function softDeleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw new Error(`Failed to delete event: ${error.message}`)
}

export async function recomputeEventCapacity(eventId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("recompute_event_capacity", { p_event_id: eventId })
    if (error) throw new Error(`Failed to recompute capacity: ${error.message}`)
  } catch (err) {
    console.error("recomputeEventCapacity:", err)
    throw err
  }
}
