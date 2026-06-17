"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { AlertCircle, FileText, Loader2, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { cn, formatDateTime } from "@/lib/utils"
import { resolveStorageUrl } from "@/lib/storage"
import { fetchMessages } from "@/data/chats"
import type { ChatMessage, Conversation } from "@/data/chats"

interface MessageThreadProps {
  conversation: Conversation
  initialMessages: ChatMessage[]
  initialCursor: string | null
}

export function MessageThread({
  conversation,
  initialMessages,
  initialCursor,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(initialCursor !== null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on initial load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  const loadOlder = useCallback(async () => {
    if (!cursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const result = await fetchMessages(conversation.id, { before: cursor, limit: 30 })
      if (result.messages.length === 0) {
        setHasMore(false)
        return
      }
      // Prepend older messages (they come newest-first, so reverse to chronological and prepend)
      setMessages((prev) => [...result.messages.reverse(), ...prev])
      setCursor(result.cursor)
      if (!result.cursor || result.messages.length < 30) setHasMore(false)
    } finally {
      setLoadingOlder(false)
    }
  }, [conversation.id, cursor, loadingOlder])

  // Chronological display: initialMessages come newest-first, reverse for display
  const displayMessages = messages.slice().reverse()

  function isBusinessSender(msg: ChatMessage): boolean {
    return msg.senderId === conversation.businessId
  }

  return (
    <div className="flex flex-col h-full">
      {/* Read-only banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm flex-shrink-0">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          Viewing this conversation for dispute resolution only. Admins cannot send messages.
        </span>
      </div>

      {/* Messages scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load older button */}
        {hasMore && (
          <div className="flex justify-center pt-2 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="gap-2"
            >
              {loadingOlder ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
              {loadingOlder ? "Loading…" : "Load older messages"}
            </Button>
          </div>
        )}

        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <span>No messages in this conversation</span>
          </div>
        )}

        {displayMessages.map((msg, idx) => {
          const isBusiness = isBusinessSender(msg)
          const prevMsg = idx > 0 ? displayMessages[idx - 1] : null
          const sameAsPrev = prevMsg?.senderId === msg.senderId

          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2 items-end",
                isBusiness ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Avatar — show only when sender changes */}
              <div className="flex-shrink-0 w-8">
                {!sameAsPrev && (
                  <RemoteAvatar
                    src={isBusiness ? conversation.business?.avatarUrl : conversation.influencer?.avatarUrl}
                    alt={isBusiness ? (conversation.business?.displayName ?? "Business") : (conversation.influencer?.displayName ?? "Influencer")}
                    size={32}
                  />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[70%] space-y-1",
                  isBusiness ? "items-start" : "items-end",
                  "flex flex-col"
                )}
              >
                {/* Sender name on first message in group */}
                {!sameAsPrev && (
                  <span className={cn(
                    "text-xs text-muted-foreground px-1",
                    isBusiness ? "text-left" : "text-right"
                  )}>
                    {isBusiness
                      ? (conversation.business?.displayName ?? "Business")
                      : (conversation.influencer?.displayName ?? "Influencer")}
                    &nbsp;·&nbsp;
                    {isBusiness ? "Business" : "Influencer"}
                  </span>
                )}

                <MessageBubble msg={msg} isBusiness={isBusiness} />

                <span className={cn(
                  "text-xs text-muted-foreground/70 px-1",
                  isBusiness ? "text-left" : "text-right"
                )}>
                  {formatDateTime(msg.createdAt)}
                </span>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function MessageBubble({ msg, isBusiness }: { msg: ChatMessage; isBusiness: boolean }) {
  const bubbleClass = cn(
    "rounded-2xl px-3 py-2 text-sm break-words",
    isBusiness
      ? "bg-muted text-foreground rounded-bl-sm"
      : "bg-primary text-primary-foreground rounded-br-sm"
  )

  if (msg.messageType === "image") {
    const src = resolveStorageUrl(msg.content ?? undefined)
    return (
      <div className={cn(bubbleClass, "p-1.5")}>
        {src ? (
          <Image
            src={src}
            alt="Image message"
            width={0}
            height={0}
            sizes="320px"
            className="rounded-xl object-cover"
            style={{ width: "100%", height: "auto", maxWidth: "320px", maxHeight: "256px" }}
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = "none"
              const parent = target.parentElement
              if (parent) parent.textContent = "Image unavailable"
            }}
          />
        ) : (
          <span className="text-xs opacity-70">Image unavailable</span>
        )}
      </div>
    )
  }

  if (msg.messageType === "file") {
    const src = resolveStorageUrl(msg.content ?? undefined)
    return (
      <div className={bubbleClass}>
        {src ? (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 underline underline-offset-2"
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span>View attachment</span>
          </a>
        ) : (
          <span className="flex items-center gap-1.5 opacity-70">
            <FileText className="h-4 w-4 flex-shrink-0" />
            File unavailable
          </span>
        )}
      </div>
    )
  }

  // text
  return <div className={bubbleClass}>{msg.content ?? ""}</div>
}
