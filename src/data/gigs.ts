import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ─── Enums ────────────────────────────────────────────────────────────────────
export type GigStatus = "draft" | "active" | "completed" | "cancelled"
export type CompensationType = "freebie" | "paid" | "per_day" | "flat" | "barter"
export type ApplicationStatus =
  | "applied"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "started"
  | "verification_pending"
  | "completed"
  | "cancelled"

// ─── DB row types ─────────────────────────────────────────────────────────────
interface GigRow {
  id: string
  business_id: string
  title: string
  description: string | null
  category: string | null
  content_type: string | null
  content_instructions: string | null
  restrictions: string | null
  specific_visuals: string | null
  requirements: Record<string, unknown> | null
  cover_image: string | null
  gallery: unknown | null
  compensation_type: CompensationType
  compensation_amount: number | null
  currency: string | null
  application_deadline: string | null
  status: GigStatus
  city: string | null
  venue_address: string | null
  additional_guest: boolean | null
  additional_data: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  users: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface GigSlotRow {
  id: string
  gig_id: string
  slot_start: string
  slot_end: string
  capacity: number
  capacity_reached: boolean
  created_at: string
  updated_at: string
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
  applied_at: string | null
  status_changed_at: string | null
  started_at: string | null
  created_at: string
  updated_at: string
  users: {
    id: string
    display_name: string | null
  } | null
}

// ─── Public types ─────────────────────────────────────────────────────────────
export type Gig = {
  id: string
  businessId: string
  businessName: string | null
  businessAvatarUrl: string | null
  title: string
  description: string | null
  category: string | null
  contentType: string | null
  contentInstructions: string | null
  restrictions: string | null
  specificVisuals: string | null
  requirements: Record<string, unknown> | null
  coverImageUrl: string | null
  gallery: unknown | null
  compensationType: CompensationType
  compensationAmount: number | null
  currency: string | null
  applicationDeadline: string | null
  status: GigStatus
  city: string | null
  venueAddress: string | null
  additionalGuest: boolean | null
  additionalData: Record<string, unknown> | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type GigSlot = {
  id: string
  gigId: string
  slotStart: string
  slotEnd: string
  capacity: number
  capacityReached: boolean
  createdAt: string
  updatedAt: string
}

export type GigApplication = {
  id: string
  targetType: string
  targetId: string
  influencerId: string
  businessId: string
  slotId: string | null
  status: ApplicationStatus
  applicationMessage: string | null
  appliedAt: string | null
  statusChangedAt: string | null
  startedAt: string | null
  influencerName: string | null
  createdAt: string
  updatedAt: string
}

export type GigDetail = Gig & {
  slots: GigSlot[]
  applications: GigApplication[]
}

// ─── Fetch params ─────────────────────────────────────────────────────────────
export interface FetchGigsParams {
  status?: GigStatus | ""
  search?: string
  compensationType?: CompensationType | ""
}

// ─── Data functions ───────────────────────────────────────────────────────────

function mapGigRow(row: GigRow): Gig {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.users?.display_name ?? null,
    businessAvatarUrl: resolveStorageUrl(row.users?.avatar_url ?? null),
    title: row.title,
    description: row.description,
    category: row.category,
    contentType: row.content_type,
    contentInstructions: row.content_instructions,
    restrictions: row.restrictions,
    specificVisuals: row.specific_visuals,
    requirements: row.requirements,
    coverImageUrl: resolveStorageUrl(row.cover_image),
    gallery: row.gallery,
    compensationType: row.compensation_type,
    compensationAmount: row.compensation_amount,
    currency: row.currency,
    applicationDeadline: row.application_deadline,
    status: row.status,
    city: row.city,
    venueAddress: row.venue_address,
    additionalGuest: row.additional_guest,
    additionalData: row.additional_data,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchGigs(params: FetchGigsParams = {}): Promise<Gig[]> {
  try {
    let query = supabase
      .from("gigs")
      .select("*, users!business_id(id, display_name, avatar_url)")
      .order("created_at", { ascending: false })

    if (params.status) {
      query = query.eq("status", params.status)
    }
    if (params.compensationType) {
      query = query.eq("compensation_type", params.compensationType)
    }
    if (params.search) {
      query = query.ilike("title", `%${params.search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("fetchGigs error:", error)
      return []
    }

    return ((data ?? []) as unknown as GigRow[]).map(mapGigRow)
  } catch (err) {
    console.error("fetchGigs exception:", err)
    return []
  }
}

export async function fetchGigDetail(id: string): Promise<GigDetail | null> {
  try {
    const { data, error } = await supabase
      .from("gigs")
      .select(
        "*, users!business_id(*), gig_slots(*), applications(*, users!influencer_id(id, display_name))"
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("fetchGigDetail error:", error)
      return null
    }

    const row = data as unknown as GigRow & {
      gig_slots: GigSlotRow[]
      applications: ApplicationRow[]
    }

    const gig = mapGigRow(row)

    const slots: GigSlot[] = (row.gig_slots ?? []).map((s) => ({
      id: s.id,
      gigId: s.gig_id,
      slotStart: s.slot_start,
      slotEnd: s.slot_end,
      capacity: s.capacity,
      capacityReached: s.capacity_reached,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))

    const applications: GigApplication[] = (row.applications ?? []).map((a) => ({
      id: a.id,
      targetType: a.target_type,
      targetId: a.target_id,
      influencerId: a.influencer_id,
      businessId: a.business_id,
      slotId: a.slot_id,
      status: a.status,
      applicationMessage: a.application_message,
      appliedAt: a.applied_at,
      statusChangedAt: a.status_changed_at,
      startedAt: a.started_at,
      influencerName: a.users?.display_name ?? null,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }))

    return { ...gig, slots, applications }
  } catch (err) {
    console.error("fetchGigDetail exception:", err)
    return null
  }
}

export async function updateGig(
  id: string,
  patch: Partial<{
    title: string
    description: string
    category: string
    content_type: string
    content_instructions: string
    restrictions: string
    specific_visuals: string
    compensation_type: CompensationType
    compensation_amount: number | null
    currency: string
    application_deadline: string | null
    city: string
    venue_address: string
    additional_guest: boolean
  }>
): Promise<void> {
  const { error } = await supabase.from("gigs").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function setGigStatus(id: string, status: GigStatus): Promise<void> {
  const { error } = await supabase.from("gigs").update({ status }).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function softDeleteGig(id: string): Promise<void> {
  const { error } = await supabase
    .from("gigs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export interface UpsertSlotPayload {
  id?: string
  gig_id: string
  slot_start: string
  slot_end: string
  capacity: number
}

export async function upsertSlot(slot: UpsertSlotPayload): Promise<void> {
  const { error } = await supabase.from("gig_slots").upsert(slot)
  if (error) throw new Error(error.message)
}

export async function deleteSlot(slotId: string): Promise<void> {
  const { error } = await supabase.from("gig_slots").delete().eq("id", slotId)
  if (error) throw new Error(error.message)
}

export async function recomputeSlotCapacity(slotId: string): Promise<void> {
  const { error } = await supabase.rpc("recompute_slot_capacity", {
    p_slot_id: slotId,
  })
  if (error) throw new Error(error.message)
}
