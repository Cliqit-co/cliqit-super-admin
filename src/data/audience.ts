import { supabase } from "@/lib/supabase"

export type AudienceTarget =
  | { type: "all_users" }
  | { type: "all_influencers" }
  | { type: "all_businesses" }
  | { type: "specific_user"; userId: string }
  | { type: "filtered_influencers"; verified?: boolean; city?: string; niche?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

async function queryFilteredInfluencers(
  target: { verified?: boolean; city?: string; niche?: string },
  selectArgs: [string, object?] | [string],
): Promise<{ data: Array<{ user_id: string }> | null; count?: number | null; error: unknown }> {
  const hasVerified = target.verified !== undefined

  let q: AnyQuery = hasVerified
    ? supabase
        .from("influencer_profiles")
        .select(
          selectArgs.length === 2
            ? `user_id, users!inner(verified_user), ${selectArgs[0]}`
            : "user_id, users!inner(verified_user)",
          selectArgs[1] as object,
        )
        .eq("users.verified_user", target.verified)
    : supabase
        .from("influencer_profiles")
        .select(...(selectArgs as [string, object]))

  if (target.city) q = q.ilike("city", `%${target.city}%`)
  if (target.niche) q = q.ilike("niche", `%${target.niche}%`)

  return q
}

export async function resolveAudience(target: AudienceTarget): Promise<string[]> {
  if (target.type === "specific_user") {
    return [target.userId]
  }

  if (target.type === "all_users") {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .is("deleted_at", null)
    if (error) throw error
    return (data ?? []).map((r) => r.id as string)
  }

  if (target.type === "all_influencers") {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", "influencer")
      .is("deleted_at", null)
    if (error) throw error
    return (data ?? []).map((r) => r.id as string)
  }

  if (target.type === "all_businesses") {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", "business")
      .is("deleted_at", null)
    if (error) throw error
    return (data ?? []).map((r) => r.id as string)
  }

  if (target.type === "filtered_influencers") {
    const { data, error } = await queryFilteredInfluencers(
      { verified: target.verified, city: target.city, niche: target.niche },
      ["user_id"],
    )
    if (error) throw error
    return (data ?? []).map((r) => r.user_id)
  }

  return []
}

export async function countAudience(target: AudienceTarget): Promise<number> {
  if (target.type === "specific_user") {
    return 1
  }

  if (target.type === "all_users") {
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
    if (error) throw error
    return count ?? 0
  }

  if (target.type === "all_influencers") {
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "influencer")
      .is("deleted_at", null)
    if (error) throw error
    return count ?? 0
  }

  if (target.type === "all_businesses") {
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "business")
      .is("deleted_at", null)
    if (error) throw error
    return count ?? 0
  }

  if (target.type === "filtered_influencers") {
    const { count, error } = await queryFilteredInfluencers(
      { verified: target.verified, city: target.city, niche: target.niche },
      ["user_id", { count: "exact", head: true }],
    )
    if (error) throw error
    return count ?? 0
  }

  return 0
}
