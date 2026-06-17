"use client"

import { useRouter } from "next/navigation"
import { MessageSquare, Briefcase } from "lucide-react"
import { RemoteAvatar } from "@/components/remote-avatar"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { cn, formatDateTime } from "@/lib/utils"
import type { Conversation } from "@/data/chats"

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
}

function lastMessagePreview(content: string | null, type: string | null): string {
  if (!content && !type) return "No messages yet"
  if (type === "image") return "📷 Image"
  if (type === "file") return "📎 File"
  if (!content) return ""
  return content.length > 80 ? content.slice(0, 80) + "…" : content
}

export function ConversationList({ conversations, selectedId }: ConversationListProps) {
  const router = useRouter()

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <MessageSquare className="h-10 w-10 opacity-40" />
        <p className="text-sm">No conversations found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId

        return (
          <button
            key={conv.id}
            onClick={() => router.push(`/dashboard/chats/${conv.id}`)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start",
              isSelected && "bg-muted"
            )}
          >
            {/* Avatars stack */}
            <div className="relative flex-shrink-0 w-10 h-10">
              <RemoteAvatar
                src={conv.business?.avatarUrl}
                alt={conv.business?.displayName ?? "Business"}
                size={28}
                className="absolute top-0 left-0 ring-2 ring-background"
              />
              <RemoteAvatar
                src={conv.influencer?.avatarUrl}
                alt={conv.influencer?.displayName ?? "Influencer"}
                size={28}
                className="absolute bottom-0 right-0 ring-2 ring-background"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-medium text-sm truncate">
                  {conv.business?.displayName ?? "Unknown Business"}
                  <span className="text-muted-foreground font-normal"> &amp; </span>
                  {conv.influencer?.displayName ?? "Unknown Influencer"}
                </span>
                {conv.lastMessageAt && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDateTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>

              {conv.gigTitle && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Briefcase className="h-3 w-3" />
                  <span className="truncate">{conv.gigTitle}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground truncate">
                  {lastMessagePreview(conv.lastMessageContent, conv.lastMessageType)}
                </p>
                <StatusBadge status={conv.status} className="text-xs py-0 h-5" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
