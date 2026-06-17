import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ── Enums ─────────────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | "applied"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "started"
  | "verification_pending"
  | "completed"
  | "cancelled"

export type TargetType = "gig" | "event"

// ── Application state machine ─────────────────────────────────────────────────
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["approved", "rejected", "withdrawn", "cancelled"],
  approved: ["started", "rejected", "cancelled", "withdrawn"],
  started: ["verification_pending", "cancelled"],
  verification_pending: ["completed", "rejected"],
  completed: [],
  rejected: [],
  withdrawn: [],
  cancelled: [],
}

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type ApplicationListItem = {
  id: string
  targetType: TargetType
  targetId: string
  targetTitle: string | null
  influencerId: string
  influencerName: string | null
  influencerAvatar: string | null
  businessId: string
  businessName: string | null
  slotId: string | null
  status: ApplicationStatus
  applicationMessage: string | null
  appliedAt: string
  checkinAt: string | null
  statusChangedAt: string | null
}

export type ApplicationDetail = ApplicationListItem & {
  influencerEmail: string | null
  influencerPhone: string | null
  startedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── DB row types ──────────────────────────────────────────────────────────────
interface ApplicationRow {
  id: string
  target_type: string
  target_id: string
  influencer_id: string
  business_id: string
  slot_id: string | null
  status: string
  application_message: string | null
  applied_at: string
  checkin_at: string | null
  status_changed_at: string | null
  started_at: string | null
  created_at: string
  updated_at: string
  influencer: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  business: {
    id: string
    display_name: string | null
  } | null
}

interface GigRow {
  id: string
  title: string
}

interface EventRow {
  id: string
  title: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapRow(
  row: ApplicationRow,
  titleMap: Record<string, string>,
): ApplicationListItem {
  return {
    id: row.id,
    targetType: row.target_type as TargetType,
    targetId: row.target_id,
    targetTitle: titleMap[row.target_id] ?? null,
    influencerId: row.influencer_id,
    influencerName: row.influencer?.display_name ?? null,
    influencerAvatar: resolveStorageUrl(row.influencer?.avatar_url ?? undefined),
    businessId: row.business_id,
    businessName: row.business?.display_name ?? null,
    slotId: row.slot_id,
    status: row.status as ApplicationStatus,
    applicationMessage: row.application_message,
    appliedAt: row.applied_at,
    checkinAt: row.checkin_at,
    statusChangedAt: row.status_changed_at,
  }
}

async function resolveTitles(rows: ApplicationRow[]): Promise<Record<string, string>> {
  const gigIds = rows.filter((r) => r.target_type === "gig").map((r) => r.target_id)
  const eventIds = rows.filter((r) => r.target_type === "event").map((r) => r.target_id)

  const titleMap: Record<string, string> = {}

  if (gigIds.length > 0) {
    try {
      const { data } = await supabase
        .from("gigs")
        .select("id, title")
        .in("id", gigIds)
      for (const g of (data ?? []) as GigRow[]) {
        titleMap[g.id] = g.title
      }
    } catch {
      // graceful — titles will be null
    }
  }

  if (eventIds.length > 0) {
    try {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds)
      for (const e of (data ?? []) as EventRow[]) {
        titleMap[e.id] = e.title
      }
    } catch {
      // graceful
    }
  }

  return titleMap
}

// ── Reads ─────────────────────────────────────────────────────────────────────
export async function fetchApplications(params?: {
  status?: ApplicationStatus | ""
  targetType?: TargetType | ""
  search?: string
}): Promise<ApplicationListItem[]> {
  try {
    let query = supabase
      .from("applications")
      .select(
        "*, influencer:users!influencer_id(id, display_name, avatar_url), business:users!business_id(id, display_name)",
      )
      .order("applied_at", { ascending: false })

    if (params?.status) {
      query = query.eq("status", params.status)
    }
    if (params?.targetType) {
      query = query.eq("target_type", params.targetType)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as unknown as ApplicationRow[]

    // Client-side search filter on influencer/business name
    const filtered =
      params?.search
        ? rows.filter((r) => {
            const q = params.search!.toLowerCase()
            return (
              (r.influencer?.display_name ?? "").toLowerCase().includes(q) ||
              (r.business?.display_name ?? "").toLowerCase().includes(q)
            )
          })
        : rows

    const titleMap = await resolveTitles(filtered)
    return filtered.map((r) => mapRow(r, titleMap))
  } catch {
    return []
  }
}

export async function fetchApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        "*, influencer:users!influencer_id(id, display_name, avatar_url), business:users!business_id(id, display_name)",
      )
      .eq("id", id)
      .single()

    if (error) throw error

    const row = data as unknown as ApplicationRow
    const titleMap = await resolveTitles([row])

    // Fetch PII via admin RPC (try/catch — may not be deployed)
    let email: string | null = null
    let phone: string | null = null
    try {
      const { data: contact } = await supabase.rpc("admin_get_user_contact", {
        p_user_id: row.influencer_id,
      })
      if (contact) {
        email = (contact as { email?: string }).email ?? null
        phone = (contact as { phone_number?: string }).phone_number ?? null
      }
    } catch {
      // RPC not deployed — show without PII
    }

    return {
      ...mapRow(row, titleMap),
      influencerEmail: email,
      influencerPhone: phone,
      startedAt: row.started_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch {
    return null
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Update application status.
 * ALWAYS fires the notify-gig-activity trigger → must be gated behind ConfirmDialog.
 * Throws on error so callers can toast.
 * Throws with code "23505" if a forced revive conflicts with the unique-active index.
 */
export async function setApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Cannot revive: influencer already has an active application for this gig",
      )
    }
    throw new Error(error.message || "Failed to update application status")
  }
}
