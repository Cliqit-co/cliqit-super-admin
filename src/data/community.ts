import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"

// ── DB row types (snake_case) ────────────────────────────────────────────────

interface CommunityPostRow {
  id: string
  author_id: string
  post_text: string | null
  media_file_url: string | null
  visibility: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  author: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  likes_count: { count: number }[]
  comments_count: { count: number }[]
}

interface CommunityCommentRow {
  id: string
  post_id: string
  author_id: string
  comment_text: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  author: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

// ── TS types (camelCase) ─────────────────────────────────────────────────────

export type PostStatus = "visible" | "hidden" | "deleted"

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string | null
  authorAvatarUrl: string | null
  postText: string | null
  mediaFileUrl: string | null
  visibility: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  likesCount: number
  commentsCount: number
  status: PostStatus
}

export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  authorName: string | null
  authorAvatarUrl: string | null
  commentText: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(row: { deleted_at: string | null; visibility: boolean }): PostStatus {
  if (row.deleted_at !== null) return "deleted"
  if (!row.visibility) return "hidden"
  return "visible"
}

function mapPost(row: CommunityPostRow): CommunityPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author?.display_name ?? null,
    authorAvatarUrl: resolveStorageUrl(row.author?.avatar_url ?? undefined),
    postText: row.post_text,
    mediaFileUrl: resolveStorageUrl(row.media_file_url ?? undefined),
    visibility: row.visibility,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likesCount: row.likes_count?.[0]?.count ?? 0,
    commentsCount: row.comments_count?.[0]?.count ?? 0,
    status: deriveStatus(row),
  }
}

function mapComment(row: CommunityCommentRow): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author?.display_name ?? null,
    authorAvatarUrl: resolveStorageUrl(row.author?.avatar_url ?? undefined),
    commentText: row.comment_text,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── reads ────────────────────────────────────────────────────────────────────

export interface FetchCommunityPostsParams {
  filter?: "all" | "visible" | "hidden" | "deleted"
  search?: string
  page?: number
  limit?: number
}

export async function fetchCommunityPosts(
  params?: FetchCommunityPostsParams
): Promise<CommunityPost[]> {
  const { filter = "all", search, page = 0, limit = 20 } = params ?? {}

  try {
    let query = supabase
      .from("community_posts")
      .select(
        "*, author:users!author_id(id, display_name, avatar_url), likes_count:community_post_likes(count), comments_count:community_post_comments(count)"
      )

    // Apply filter
    if (filter === "visible") {
      query = query.eq("visibility", true).is("deleted_at", null)
    } else if (filter === "hidden") {
      query = query.eq("visibility", false).is("deleted_at", null)
    } else if (filter === "deleted") {
      query = query.not("deleted_at", "is", null)
    }
    // 'all' → no filter on deleted_at or visibility

    if (search) {
      query = query.ilike("post_text", `%${search}%`)
    }

    query = query
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) {
      console.error("fetchCommunityPosts error:", error)
      return []
    }

    return ((data ?? []) as unknown as CommunityPostRow[]).map(mapPost)
  } catch (err) {
    console.error("fetchCommunityPosts error:", err)
    return []
  }
}

export async function fetchCommunityPostDetail(postId: string): Promise<CommunityPost | null> {
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select(
        "*, author:users!author_id(id, display_name, avatar_url), likes_count:community_post_likes(count), comments_count:community_post_comments(count)"
      )
      .eq("id", postId)
      .single()

    if (error) {
      console.error("fetchCommunityPostDetail error:", error)
      return null
    }

    return mapPost(data as unknown as CommunityPostRow)
  } catch (err) {
    console.error("fetchCommunityPostDetail error:", err)
    return null
  }
}

export async function fetchCommunityComments(postId: string): Promise<CommunityComment[]> {
  try {
    const { data, error } = await supabase
      .from("community_post_comments")
      .select("*, author:users!author_id(id, display_name, avatar_url)")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("fetchCommunityComments error:", error)
      return []
    }

    return ((data ?? []) as unknown as CommunityCommentRow[]).map(mapComment)
  } catch (err) {
    console.error("fetchCommunityComments error:", err)
    return []
  }
}

// ── mutations (throw on error so callers can toast) ──────────────────────────

export async function setPostVisibility(postId: string, visible: boolean): Promise<void> {
  const { error } = await supabase
    .from("community_posts")
    .update({ visibility: visible })
    .eq("id", postId)

  if (error) throw new Error(error.message)
}

export async function softDeletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("community_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)

  if (error) throw new Error(error.message)
}

export async function restorePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("community_posts")
    .update({ deleted_at: null, visibility: true })
    .eq("id", postId)

  if (error) throw new Error(error.message)
}

export async function softDeleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("community_post_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) throw new Error(error.message)
}

export async function restoreComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("community_post_comments")
    .update({ deleted_at: null })
    .eq("id", commentId)

  if (error) throw new Error(error.message)
}
