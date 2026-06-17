"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Eye, EyeOff, Trash2, RotateCcw, ImageOff, Heart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RemoteAvatar } from "@/components/remote-avatar"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CommentItem } from "@/components/community/comment-item"
import { Badge } from "@/components/ui/badge"
import { cn, formatDateTime } from "@/lib/utils"
import {
  fetchCommunityPostDetail,
  fetchCommunityComments,
  setPostVisibility,
  softDeletePost,
  restorePost,
  softDeleteComment,
  restoreComment,
  type CommunityPost,
  type CommunityComment,
  type PostStatus,
} from "@/data/community"

function PostStatusBadge({ status }: { status: PostStatus }) {
  const config: Record<PostStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
    visible: { label: "Visible", variant: "success" },
    hidden: { label: "Hidden", variant: "warning" },
    deleted: { label: "Deleted", variant: "destructive" },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

type PostActionType = "hide" | "show" | "delete" | "restore"
type CommentActionType = "delete" | "restore"

export default function CommunityPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // action state
  const [actionLoading, setActionLoading] = useState(false)
  const [postConfirm, setPostConfirm] = useState<PostActionType | null>(null)
  const [commentConfirm, setCommentConfirm] = useState<{
    type: CommentActionType
    comment: CommunityComment
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [postData, commentsData] = await Promise.all([
        fetchCommunityPostDetail(postId),
        fetchCommunityComments(postId),
      ])
      if (!postData) {
        setError("Post not found.")
      } else {
        setPost(postData)
        setComments(commentsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Post actions ─────────────────────────────────────────────────────────────

  const handlePostConfirm = async () => {
    if (!post || !postConfirm) return
    setActionLoading(true)
    try {
      if (postConfirm === "hide") {
        await setPostVisibility(post.id, false)
        setPost((p) => p ? { ...p, visibility: false, status: "hidden" as const } : p)
      } else if (postConfirm === "show") {
        await setPostVisibility(post.id, true)
        setPost((p) => p ? { ...p, visibility: true, status: "visible" as const } : p)
      } else if (postConfirm === "delete") {
        await softDeletePost(post.id)
        const deletedAt = new Date().toISOString()
        setPost((p) => p ? { ...p, deletedAt, status: "deleted" as const } : p)
      } else if (postConfirm === "restore") {
        await restorePost(post.id)
        setPost((p) => p ? { ...p, deletedAt: null, visibility: true, status: "visible" as const } : p)
      }
      setPostConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
      setPostConfirm(null)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Comment actions ───────────────────────────────────────────────────────────

  const handleCommentConfirm = async () => {
    if (!commentConfirm) return
    const { type, comment } = commentConfirm
    setActionLoading(true)
    try {
      if (type === "delete") {
        await softDeleteComment(comment.id)
        const deletedAt = new Date().toISOString()
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, deletedAt } : c))
        )
      } else if (type === "restore") {
        await restoreComment(comment.id)
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, deletedAt: null } : c))
        )
      }
      setCommentConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comment action failed")
      setCommentConfirm(null)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Post confirm config ───────────────────────────────────────────────────────

  const postConfirmConfig = postConfirm
    ? ({
        hide: {
          title: "Hide post?",
          description: "The post will be hidden from users. You can restore visibility later.",
          confirmLabel: "Hide",
          destructive: false,
        },
        show: {
          title: "Show post?",
          description: "The post will become visible to all users.",
          confirmLabel: "Show",
          destructive: false,
        },
        delete: {
          title: "Delete post?",
          description: "The post will be soft-deleted and hidden from all users. You can restore it later.",
          confirmLabel: "Delete",
          destructive: true,
        },
        restore: {
          title: "Restore post?",
          description: "The post will be restored and made visible to users.",
          confirmLabel: "Restore",
          destructive: false,
        },
      } as const)[postConfirm]
    : null

  const commentConfirmConfig = commentConfirm
    ? ({
        delete: {
          title: "Delete comment?",
          description: "The comment will be soft-deleted. You can restore it later.",
          confirmLabel: "Delete",
          destructive: true,
        },
        restore: {
          title: "Restore comment?",
          description: "The comment will be restored and visible on the post.",
          confirmLabel: "Restore",
          destructive: false,
        },
      } as const)[commentConfirm.type]
    : null

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">Loading post...</div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!post) return null

  const isDeleted = post.status === "deleted"
  const isHidden = post.status === "hidden"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Post Detail</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Post card */}
      <Card className={cn(isDeleted && "opacity-70")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <RemoteAvatar
                src={post.authorAvatarUrl}
                alt={post.authorName ?? "User"}
                size={48}
              />
              <div>
                <div className="font-medium">{post.authorName ?? "Unknown user"}</div>
                <div className="text-xs text-muted-foreground">{formatDateTime(post.createdAt)}</div>
              </div>
            </div>
            <PostStatusBadge status={post.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post text */}
          {post.postText && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {post.postText}
            </p>
          )}

          {/* Media */}
          {post.mediaFileUrl && (
            <div className="rounded-lg overflow-hidden max-w-lg">
              <Image
                src={post.mediaFileUrl}
                alt="Post media"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = "none"
                  const placeholder = target.nextElementSibling as HTMLElement | null
                  if (placeholder) placeholder.style.display = "flex"
                }}
              />
              <div className="hidden w-full h-32 bg-muted items-center justify-center rounded-lg">
                <ImageOff className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.likesCount} likes
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.commentsCount} comments
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => setPostConfirm("restore")}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore Post
              </Button>
            ) : (
              <>
                {isHidden ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setPostConfirm("show")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Show Post
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setPostConfirm("hide")}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Post
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setPostConfirm("delete")}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Post
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">No comments.</div>
          ) : (
            <div className="divide-y divide-border">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={(c) => setCommentConfirm({ type: "delete", comment: c })}
                  onRestore={(c) => setCommentConfirm({ type: "restore", comment: c })}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post confirm dialog */}
      {postConfirm && postConfirmConfig && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setPostConfirm(null)}
          title={postConfirmConfig.title}
          description={postConfirmConfig.description}
          confirmLabel={postConfirmConfig.confirmLabel}
          destructive={postConfirmConfig.destructive}
          loading={actionLoading}
          onConfirm={handlePostConfirm}
        />
      )}

      {/* Comment confirm dialog */}
      {commentConfirm && commentConfirmConfig && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setCommentConfirm(null)}
          title={commentConfirmConfig.title}
          description={commentConfirmConfig.description}
          confirmLabel={commentConfirmConfig.confirmLabel}
          destructive={commentConfirmConfig.destructive}
          loading={actionLoading}
          onConfirm={handleCommentConfirm}
        />
      )}
    </div>
  )
}
