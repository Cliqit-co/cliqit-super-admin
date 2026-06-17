"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { MessageThread } from "@/components/chats/message-thread"
import { fetchConversationById, fetchMessages } from "@/data/chats"
import type { Conversation, ChatMessage } from "@/data/chats"
import { formatDate } from "@/lib/utils"

export default function ConversationDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!conversationId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  async function load() {
    setLoading(true)
    try {
      const [conv, msgResult] = await Promise.all([
        fetchConversationById(conversationId),
        fetchMessages(conversationId, { limit: 30 }),
      ])

      if (!conv) {
        setNotFound(true)
        return
      }

      setConversation(conv)
      setMessages(msgResult.messages)
      setCursor(msgResult.cursor)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading conversation…
      </div>
    )
  }

  if (notFound || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p className="text-sm">Conversation not found or has been deleted.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/chats")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to conversations
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/chats")}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Participants */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex -space-x-1">
            <RemoteAvatar
              src={conversation.business?.avatarUrl}
              alt={conversation.business?.displayName ?? "Business"}
              size={32}
              className="ring-2 ring-background"
            />
            <RemoteAvatar
              src={conversation.influencer?.avatarUrl}
              alt={conversation.influencer?.displayName ?? "Influencer"}
              size={32}
              className="ring-2 ring-background"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              <span>{conversation.business?.displayName ?? "Unknown Business"}</span>
              <span className="text-muted-foreground font-normal"> &amp; </span>
              <span>{conversation.influencer?.displayName ?? "Unknown Influencer"}</span>
            </p>
            {conversation.gigTitle && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span className="truncate">{conversation.gigTitle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={conversation.status} />
          <span className="text-xs text-muted-foreground">
            Started {formatDate(conversation.createdAt)}
          </span>
        </div>

        {/* Jump to participants */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() =>
              router.push(`/dashboard/users/${conversation.businessId}`)
            }
          >
            <ExternalLink className="h-3 w-3" />
            Business
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() =>
              router.push(`/dashboard/users/${conversation.influencerId}`)
            }
          >
            <ExternalLink className="h-3 w-3" />
            Influencer
          </Button>
          {conversation.gigId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() =>
                router.push(`/dashboard/gigs/${conversation.gigId}`)
              }
            >
              <ExternalLink className="h-3 w-3" />
              Gig
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-hidden">
        <MessageThread
          conversation={conversation}
          initialMessages={messages}
          initialCursor={cursor}
        />
      </div>
    </div>
  )
}
