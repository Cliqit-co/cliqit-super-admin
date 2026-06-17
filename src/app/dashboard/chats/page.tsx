"use client"

import { useEffect, useState } from "react"
import { MessageSquare, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConversationList } from "@/components/chats/conversation-list"
import { fetchConversations } from "@/data/chats"
import type { Conversation } from "@/data/chats"

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  async function load() {
    setLoading(true)
    try {
      const data = await fetchConversations()
      setConversations(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = conversations.filter((conv) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      conv.business?.displayName?.toLowerCase().includes(q) ||
      conv.influencer?.displayName?.toLowerCase().includes(q) ||
      conv.gigTitle?.toLowerCase().includes(q) ||
      conv.lastMessageContent?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Support / Chats</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              ({conversations.length})
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <Input
          placeholder="Search by business, influencer, gig or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading conversations…
          </div>
        ) : (
          <ConversationList conversations={filtered} />
        )}
      </div>
    </div>
  )
}
