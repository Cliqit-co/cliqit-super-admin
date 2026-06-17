import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"
import type { SlotChangeStatus } from "@/types/db"

// ── DB row shapes ────────────────────────────────────────────────────────────

interface SlotRow {
  id: string
  slot_start: string
  slot_end: string
  capacity: number
  capacity_reached: boolean
}

interface RequesterRow {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface GigTitleRow {
  gig_id: string
  gigs: { title: string } | null
}

interface ApplicationRow {
  gig_slots: GigTitleRow | null
}

interface SlotChangeRequestRow {
  id: string
  application_id: string
  from_slot_id: string
  requested_slot_id: string
  requested_by: string
  status: SlotChangeStatus
  reason: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  requester: RequesterRow | null
  gig: ApplicationRow | null
  from_slot: SlotRow | null
  requested_slot: SlotRow | null
}

// ── TS types ─────────────────────────────────────────────────────────────────

export type SlotInfo = {
  id: string
  slotStart: string
  slotEnd: string
  capacity: number
  capacityReached: boolean
}

export type SlotChangeRequest = {
  id: string
  applicationId: string
  fromSlotId: string
  requestedSlotId: string
  requestedBy: string
  status: SlotChangeStatus
  reason: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  requester: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  } | null
  gigTitle: string | null
  fromSlot: SlotInfo | null
  requestedSlot: SlotInfo | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapSlot(row: SlotRow | null): SlotInfo | null {
  if (!row) return null
  return {
    id: row.id,
    slotStart: row.slot_start,
    slotEnd: row.slot_end,
    capacity: row.capacity,
    capacityReached: row.capacity_reached,
  }
}

function mapRow(row: SlotChangeRequestRow): SlotChangeRequest {
  const gigSlot = row.gig?.gig_slots
  const gigTitle = gigSlot?.gigs?.title ?? null

  return {
    id: row.id,
    applicationId: row.application_id,
    fromSlotId: row.from_slot_id,
    requestedSlotId: row.requested_slot_id,
    requestedBy: row.requested_by,
    status: row.status,
    reason: row.reason ?? null,
    resolvedBy: row.resolved_by ?? null,
    resolvedAt: row.resolved_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requester: row.requester
      ? {
          id: row.requester.id,
          displayName: row.requester.display_name,
          avatarUrl: resolveStorageUrl(row.requester.avatar_url ?? undefined),
        }
      : null,
    gigTitle,
    fromSlot: mapSlot(row.from_slot),
    requestedSlot: mapSlot(row.requested_slot),
  }
}

// ── Data functions ───────────────────────────────────────────────────────────

export async function fetchSlotChangeRequests(
  status?: SlotChangeStatus
): Promise<SlotChangeRequest[]> {
  try {
    let query = supabase
      .from("slot_change_requests")
      .select(
        `
        *,
        requester:users!requested_by(id, display_name, avatar_url),
        gig:applications(gig_slots!slot_id(gig_id, gigs(title))),
        from_slot:gig_slots!from_slot_id(id, slot_start, slot_end, capacity, capacity_reached),
        requested_slot:gig_slots!requested_slot_id(id, slot_start, slot_end, capacity, capacity_reached)
      `
      )
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) {
      console.error("fetchSlotChangeRequests error:", error)
      return []
    }

    return ((data ?? []) as unknown as SlotChangeRequestRow[]).map(mapRow)
  } catch (err) {
    console.error("fetchSlotChangeRequests unexpected error:", err)
    return []
  }
}

export async function resolveSlotChangeRequest(
  id: string,
  resolution: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("slot_change_requests")
    .update({ status: resolution })
    .eq("id", id)

  if (error) {
    throw new Error(
      `Failed to ${resolution} slot change request: ${error.message}`
    )
  }
}
