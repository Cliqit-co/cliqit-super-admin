import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

export type PublicUser = {
  id: string
  displayName: string | null
  avatarUrl: string | null
  role: string | null
}

interface PublicUserRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: string | null
}

export function mapPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: resolveStorageUrl(row.avatar_url ?? undefined),
    role: row.role,
  }
}

export async function fetchUsersByIds(
  ids: string[]
): Promise<Record<string, PublicUser>> {
  if (!ids.length) return {}
  try {
    const { data, error } = await supabase
      .from("users_public")
      .select("id, display_name, avatar_url, role")
      .in("id", ids)
    if (error || !data) return {}
    const map: Record<string, PublicUser> = {}
    for (const row of data as PublicUserRow[]) {
      map[row.id] = mapPublicUser(row)
    }
    return map
  } catch {
    return {}
  }
}
