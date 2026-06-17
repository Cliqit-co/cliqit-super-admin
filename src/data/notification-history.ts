import { supabase } from "@/lib/supabase"
import type { NotificationType } from "@/types/db"

export interface NotificationHistoryRow {
  id: string
  user_id: string | null
  notification_type: NotificationType
  title: string | null
  body: string | null
  data: Record<string, unknown> | null
  success: boolean
  error_message: string | null
  sent_at: string
  user: { id: string; display_name: string | null } | null
}

export interface NotificationHistoryFilter {
  type?: NotificationType
  success?: boolean
  userId?: string
  page?: number
  limit?: number
}

export interface NotificationHistoryResult {
  rows: NotificationHistoryRow[]
  total: number
  page: number
  limit: number
}

export async function fetchNotificationHistory(
  filter: NotificationHistoryFilter = {},
): Promise<NotificationHistoryResult> {
  const { type, success, userId, page = 1, limit = 50 } = filter

  let query = supabase
    .from("notification_history")
    .select("*, user:users!user_id(id, display_name)", { count: "exact" })
    .order("sent_at", { ascending: false })

  if (type !== undefined) {
    query = query.eq("notification_type", type)
  }

  if (success !== undefined) {
    query = query.eq("success", success)
  }

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    rows: (data ?? []) as NotificationHistoryRow[],
    total: count ?? 0,
    page,
    limit,
  }
}

export async function fetchNotificationTypes(): Promise<NotificationType[]> {
  try {
    const { data, error } = await supabase
      .from("notification_history")
      .select("notification_type")

    if (error) return []

    const unique = Array.from(
      new Set((data ?? []).map((r) => r.notification_type as NotificationType)),
    )
    return unique
  } catch {
    return []
  }
}
