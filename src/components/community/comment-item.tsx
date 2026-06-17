"use client"

import { Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { cn, formatDateTime } from "@/lib/utils"
import type { CommunityComment } from "@/data/community"

interface CommentItemProps {
  comment: CommunityComment
  onDelete: (comment: CommunityComment) => void
  onRestore: (comment: CommunityComment) => void
  loading?: boolean
}

export function CommentItem({ comment, onDelete, onRestore, loading = false }: CommentItemProps) {
  const isDeleted = comment.deletedAt !== null

  return (
    <div className={cn("flex items-start gap-3 py-3", isDeleted && "opacity-50")}>
      <RemoteAvatar
        src={comment.authorAvatarUrl}
        alt={comment.authorName ?? "User"}
        size={32}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-medium">{comment.authorName ?? "Unknown user"}</span>
          <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
          {isDeleted && (
            <span className="text-xs text-destructive font-medium">[deleted]</span>
          )}
        </div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground break-words whitespace-pre-wrap flex-1">
            {comment.commentText ?? ""}
          </p>
          <div className="flex-shrink-0">
            {isDeleted ? (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => onRestore(comment)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={loading}
                onClick={() => onDelete(comment)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
