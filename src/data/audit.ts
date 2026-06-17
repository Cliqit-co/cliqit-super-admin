import { supabase } from "@/lib/supabase"
import { fetchUsersByIds, type PublicUser } from "@/data/_shared"

// ── DB row types ────────────────────────────────────────────────────────────

interface AuditLogRow {
  id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  // fk embed (may not resolve)
  actor?: {
    id: string
    display_name: string | null
    avatar_url: string | null
    role: string | null
  } | null
}

// ── Public TS types ─────────────────────────────────────────────────────────

export type AuditEntry = {
  id: string
  actorId: string | null
  actor: PublicUser | null
  action: string
  targetType: string | null
  targetId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}

export type AuditFilter = {
  action?: string
  targetType?: string
  actorId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type AuditLogPage = {
  entries: AuditEntry[]
  total: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapRow(row: AuditLogRow, actorMap?: Record<string, PublicUser>): AuditEntry {
  const actor: PublicUser | null =
    row.actor
      ? {
          id: row.actor.id,
          displayName: row.actor.display_name,
          avatarUrl: row.actor.avatar_url,
          role: row.actor.role,
        }
      : (actorMap && row.actor_id ? actorMap[row.actor_id] ?? null : null)

  return {
    id: row.id,
    actorId: row.actor_id,
    actor,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    before: row.before,
    after: row.after,
    createdAt: row.created_at,
  }
}

// ── Data fetchers ────────────────────────────────────────────────────────────

export async function fetchAuditLog(filter?: AuditFilter): Promise<AuditLogPage> {
  const limit = filter?.limit ?? 50
  const page = filter?.page ?? 0
  const offset = page * limit

  try {
    // Primary: try FK embed via users_public view
    let query = supabase
      .from("audit_log")
      .select("*, actor:users_public!actor_id(id, display_name, avatar_url, role)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter?.action) query = query.eq("action", filter.action)
    if (filter?.targetType) query = query.eq("target_type", filter.targetType)
    if (filter?.actorId) query = query.eq("actor_id", filter.actorId)
    if (filter?.from) query = query.gte("created_at", filter.from)
    if (filter?.to) query = query.lte("created_at", filter.to)

    const { data, count, error } = await query

    if (!error && data) {
      const entries = (data as AuditLogRow[]).map((r) => mapRow(r))
      return { entries, total: count ?? 0 }
    }

    // Fallback: plain select then merge actor info via fetchUsersByIds
    let fallbackQuery = supabase
      .from("audit_log")
      .select("id, actor_id, action, target_type, target_id, before, after, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter?.action) fallbackQuery = fallbackQuery.eq("action", filter.action)
    if (filter?.targetType) fallbackQuery = fallbackQuery.eq("target_type", filter.targetType)
    if (filter?.actorId) fallbackQuery = fallbackQuery.eq("actor_id", filter.actorId)
    if (filter?.from) fallbackQuery = fallbackQuery.gte("created_at", filter.from)
    if (filter?.to) fallbackQuery = fallbackQuery.lte("created_at", filter.to)

    const { data: fbData, count: fbCount, error: fbError } = await fallbackQuery

    if (fbError || !fbData) return { entries: [], total: 0 }

    const rows = fbData as AuditLogRow[]
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])]
    const actorMap = await fetchUsersByIds(actorIds)

    const entries = rows.map((r) => mapRow(r, actorMap))
    return { entries, total: fbCount ?? 0 }
  } catch {
    return { entries: [], total: 0 }
  }
}

export async function fetchAuditActions(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("audit_log")
      .select("action")
    if (error || !data) return []
    const unique = [...new Set((data as { action: string }[]).map((r) => r.action))]
    return unique.sort()
  } catch {
    return []
  }
}
