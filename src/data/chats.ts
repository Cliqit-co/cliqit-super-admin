import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"
import type { MessageType, ChatConversationStatus } from "@/types/db"

// DB row types (snake_case)

interface PublicUserEmbed {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface GigEmbed {
  id: string
  title: string | null
}

interface ConversationRow {
  id: string
  application_id: string | null
  business_id: string
  influencer_id: string
  gig_id: string | null
  status: ChatConversationStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
  business: PublicUserEmbed | null
  influencer: PublicUserEmbed | null
  gig: GigEmbed | null
}

interface LastMessageRow {
  content: string | null
  message_type: MessageType
  created_at: string
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: MessageType
  read_at: string | null
  created_at: string
  sender: PublicUserEmbed | null
}

// Public TS types (camelCase)

export type ConversationParticipant = {
  id: string
  displayName: string | null
  avatarUrl: string | null
}

export type Conversation = {
  id: string
  applicationId: string | null
  businessId: string
  influencerId: string
  gigId: string | null
  gigTitle: string | null
  status: ChatConversationStatus
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  business: ConversationParticipant | null
  influencer: ConversationParticipant | null
  lastMessageContent: string | null
  lastMessageType: MessageType | null
  lastMessageAt: string | null
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderDisplayName: string | null
  senderAvatarUrl: string | null
  content: string | null
  messageType: MessageType
  readAt: string | null
  createdAt: string
}

export type FetchMessagesResult = {
  messages: ChatMessage[]
  /** oldest message's created_at — pass as `before` to load older */
  cursor: string | null
}

function mapParticipant(row: PublicUserEmbed | null): ConversationParticipant | null {
  if (!row) return null
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: resolveStorageUrl(row.avatar_url ?? undefined),
  }
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderDisplayName: row.sender?.display_name ?? null,
    senderAvatarUrl: resolveStorageUrl(row.sender?.avatar_url ?? undefined),
    content: row.content,
    messageType: row.message_type,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select(
        `
        *,
        business:users!business_id(id, display_name, avatar_url),
        influencer:users!influencer_id(id, display_name, avatar_url),
        gig:gigs!gig_id(id, title)
      `
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })

    if (error || !data) return []

    const rows = data as unknown as ConversationRow[]

    // Fetch last messages in parallel
    const lastMessages = await Promise.all(
      rows.map(async (row) => {
        try {
          const { data: msgData } = await supabase
            .from("chat_messages")
            .select("content, message_type, created_at")
            .eq("conversation_id", row.id)
            .order("created_at", { ascending: false })
            .limit(1)

          const msg = msgData?.[0] as LastMessageRow | undefined
          return msg ?? null
        } catch {
          return null
        }
      })
    )

    return rows.map((row, i) => {
      const lastMsg = lastMessages[i]
      return {
        id: row.id,
        applicationId: row.application_id,
        businessId: row.business_id,
        influencerId: row.influencer_id,
        gigId: row.gig_id,
        gigTitle: row.gig?.title ?? null,
        status: row.status,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        business: mapParticipant(row.business),
        influencer: mapParticipant(row.influencer),
        lastMessageContent: lastMsg?.content ?? null,
        lastMessageType: lastMsg?.message_type ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
      }
    })
  } catch {
    return []
  }
}

export async function fetchConversationById(
  conversationId: string
): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select(
        `
        *,
        business:users!business_id(id, display_name, avatar_url),
        influencer:users!influencer_id(id, display_name, avatar_url),
        gig:gigs!gig_id(id, title)
      `
      )
      .eq("id", conversationId)
      .single()

    if (error || !data) return null

    const row = data as unknown as ConversationRow
    return {
      id: row.id,
      applicationId: row.application_id,
      businessId: row.business_id,
      influencerId: row.influencer_id,
      gigId: row.gig_id,
      gigTitle: row.gig?.title ?? null,
      status: row.status,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      business: mapParticipant(row.business),
      influencer: mapParticipant(row.influencer),
      lastMessageContent: null,
      lastMessageType: null,
      lastMessageAt: null,
    }
  } catch {
    return null
  }
}

export async function fetchMessages(
  conversationId: string,
  opts?: { before?: string; limit?: number }
): Promise<FetchMessagesResult> {
  try {
    let q = supabase
      .from("chat_messages")
      .select("*, sender:users!sender_id(id, display_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 30)

    if (opts?.before) {
      q = q.lt("created_at", opts.before)
    }

    const { data, error } = await q

    if (error || !data) return { messages: [], cursor: null }

    const rows = data as unknown as MessageRow[]
    const messages = rows.map(mapMessage)

    // cursor = oldest message's created_at for "Load older"
    const cursor = rows.length > 0 ? rows[rows.length - 1].created_at : null

    return { messages, cursor }
  } catch {
    return { messages: [], cursor: null }
  }
}
