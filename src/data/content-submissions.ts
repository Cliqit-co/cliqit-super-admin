import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ── DB row types (snake_case) ──────────────────────────────────────────────

interface ContentSubmissionRow {
  id: string
  application_id: string
  target_type: string
  target_id: string
  influencer_id: string
  content_url: string
  platform: string
  status: string
  remarks: string | null
  notes: string | null
  submitted_at: string
  posted_at: string | null
  created_at: string
  updated_at: string
  influencer: {
    id: string
    display_name: string | null
    avatar_url: string | null
    role: string | null
  } | null
}

interface InsightsRow {
  id: string
  submission_id: string
  instagram_media_id: string | null
  likes_count: number | null
  comments_count: number | null
  reach: number | null
  impressions: number | null
  engagement_rate: number | null
  verified_hashtags: string[] | null
  verified_mentions: string[] | null
  requirements_met: boolean | null
  fetched_at: string | null
}

interface ContentSubmissionDetailRow extends ContentSubmissionRow {
  insights: InsightsRow[] | null
}

// ── Public TS types (camelCase) ──────────────────────────────────────────────

export type SubmissionInfluencer = {
  id: string
  displayName: string
  avatarUrl: string | null
  role: string | null
}

export type ContentSubmission = {
  id: string
  applicationId: string
  targetType: string
  targetId: string
  influencerId: string
  contentUrl: string
  platform: string
  status: string
  remarks: string | null
  notes: string | null
  submittedAt: string
  postedAt: string | null
  createdAt: string
  updatedAt: string
  influencer: SubmissionInfluencer | null
}

export type InstagramInsights = {
  id: string
  submissionId: string
  instagramMediaId: string | null
  likesCount: number | null
  commentsCount: number | null
  reach: number | null
  impressions: number | null
  engagementRate: number | null
  verifiedHashtags: string[]
  verifiedMentions: string[]
  requirementsMet: boolean | null
  fetchedAt: string | null
}

export type ContentSubmissionDetail = ContentSubmission & {
  insights: InstagramInsights | null
}

// ── Helpers ───────────────────────────────────────────────────────────────

function mapInfluencer(row: ContentSubmissionRow["influencer"]): SubmissionInfluencer | null {
  if (!row) return null
  return {
    id: row.id,
    displayName: row.display_name ?? "Unknown",
    avatarUrl: resolveStorageUrl(row.avatar_url ?? undefined),
    role: row.role,
  }
}

function mapSubmission(row: ContentSubmissionRow): ContentSubmission {
  return {
    id: row.id,
    applicationId: row.application_id,
    targetType: row.target_type,
    targetId: row.target_id,
    influencerId: row.influencer_id,
    contentUrl: row.content_url,
    platform: row.platform,
    status: row.status,
    remarks: row.remarks,
    notes: row.notes,
    submittedAt: row.submitted_at,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    influencer: mapInfluencer(row.influencer),
  }
}

function mapInsights(row: InsightsRow): InstagramInsights {
  return {
    id: row.id,
    submissionId: row.submission_id,
    instagramMediaId: row.instagram_media_id,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    reach: row.reach,
    impressions: row.impressions,
    engagementRate: row.engagement_rate,
    verifiedHashtags: row.verified_hashtags ?? [],
    verifiedMentions: row.verified_mentions ?? [],
    requirementsMet: row.requirements_met,
    fetchedAt: row.fetched_at,
  }
}

// ── Reads ─────────────────────────────────────────────────────────────────

export async function fetchSubmissions(params?: {
  status?: string
  platform?: string
  search?: string
}): Promise<ContentSubmission[]> {
  try {
    let query = supabase
      .from("content_submissions")
      .select("*, influencer:users!influencer_id(id, display_name, avatar_url, role)")
      .order("submitted_at", { ascending: false })

    if (params?.status) {
      query = query.eq("status", params.status)
    }
    if (params?.platform) {
      query = query.eq("platform", params.platform)
    }

    const { data, error } = await query

    if (error) {
      console.error("fetchSubmissions error:", error)
      return []
    }

    const rows = (data ?? []) as unknown as ContentSubmissionRow[]
    const submissions = rows.map(mapSubmission)

    if (params?.search) {
      const q = params.search.toLowerCase()
      return submissions.filter(
        (s) =>
          s.influencer?.displayName.toLowerCase().includes(q) ||
          s.contentUrl.toLowerCase().includes(q) ||
          s.platform.toLowerCase().includes(q)
      )
    }

    return submissions
  } catch (err) {
    console.error("fetchSubmissions unexpected error:", err)
    return []
  }
}

export async function fetchSubmissionDetail(id: string): Promise<ContentSubmissionDetail | null> {
  try {
    const { data, error } = await supabase
      .from("content_submissions")
      .select(
        "*, influencer:users!influencer_id(id, display_name, avatar_url), insights:instagram_media_insights!submission_id(*)"
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("fetchSubmissionDetail error:", error)
      return null
    }

    const row = data as unknown as ContentSubmissionDetailRow
    const base = mapSubmission(row)

    // insights is a 1:1 via unique FK — Supabase returns it as an array
    const insightsArr = Array.isArray(row.insights) ? row.insights : row.insights ? [row.insights] : []
    const insights = insightsArr.length > 0 ? mapInsights(insightsArr[0]) : null

    return { ...base, insights }
  } catch (err) {
    console.error("fetchSubmissionDetail unexpected error:", err)
    return null
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────
// NOTE: reviewSubmission fires the notify-on-update trigger.
// Callers MUST gate this behind a ConfirmDialog with message:
// "This will notify the influencer of the review decision."

export async function reviewSubmission(
  id: string,
  status: "completed" | "rejected",
  notes: string | null
): Promise<void> {
  const { error } = await supabase
    .from("content_submissions")
    .update({ status, notes })
    .eq("id", id)

  if (error) {
    throw new Error(error.message ?? "Failed to review submission")
  }
}

// Update notes only (admin side, no status change, no notification trigger)
export async function updateSubmissionNotes(id: string, notes: string | null): Promise<void> {
  const { error } = await supabase
    .from("content_submissions")
    .update({ notes })
    .eq("id", id)

  if (error) {
    throw new Error(error.message ?? "Failed to update notes")
  }
}
