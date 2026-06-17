"use client"

import { Heart, MessageCircle, Eye, EyeOff, Trash2, RotateCcw, ImageOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RemoteAvatar } from "@/components/remote-avatar"
import { cn, formatDateTime, truncateText } from "@/lib/utils"
import type { CommunityPost, PostStatus } from "@/data/community"

function StatusBadgeLocal({ status }: { status: PostStatus }) {
  const config: Record<PostStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
    visible: { label: "Visible", variant: "success" },
    hidden: { label: "Hidden", variant: "warning" },
    deleted: { label: "Deleted", variant: "destructive" },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

interface CommunityPostCardProps {
  post: CommunityPost
  onHide: (post: CommunityPost) => void
  onShow: (post: CommunityPost) => void
  onDelete: (post: CommunityPost) => void
  onRestore: (post: CommunityPost) => void
  onClick?: (post: CommunityPost) => void
  loading?: boolean
}

export function CommunityPostCard({
  post,
  onHide,
  onShow,
  onDelete,
  onRestore,
  onClick,
  loading = false,
}: CommunityPostCardProps) {
  const isDeleted = post.status === "deleted"
  const isHidden = post.status === "hidden"

  return (
    <Card
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-accent/40",
        isDeleted && "opacity-60"
      )}
      onClick={() => onClick?.(post)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Author avatar */}
          <RemoteAvatar
            src={post.authorAvatarUrl}
            alt={post.authorName ?? "User"}
            size={40}
          />

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">
                {post.authorName ?? "Unknown user"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(post.createdAt)}
              </span>
              <StatusBadgeLocal status={post.status} />
            </div>

            {/* Post text */}
            {post.postText && (
              <p className="text-sm text-foreground mb-2 whitespace-pre-wrap break-words">
                {truncateText(post.postText, 280)}
              </p>
            )}

            {/* Media */}
            {post.mediaFileUrl && (
              <div className="mb-3 rounded-md overflow-hidden max-w-xs">
                <img
                  src={post.mediaFileUrl}
                  alt="Post media"
                  className="w-full h-auto object-cover max-h-48"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = "none"
                    const placeholder = target.nextElementSibling as HTMLElement | null
                    if (placeholder) placeholder.style.display = "flex"
                  }}
                />
                <div
                  className="hidden w-full h-24 bg-muted items-center justify-center rounded-md"
                >
                  <ImageOff className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Counts + Actions */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {post.likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.commentsCount}
                </span>
              </div>

              {/* Action buttons */}
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {isDeleted ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => onRestore(post)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restore
                  </Button>
                ) : (
                  <>
                    {isHidden ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => onShow(post)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Show
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => onHide(post)}
                      >
                        <EyeOff className="h-3.5 w-3.5 mr-1" />
                        Hide
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={loading}
                      onClick={() => onDelete(post)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
