import { supabase } from "./supabase"

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

export interface UserNotificationStats {
  hasToken: boolean
  lastUpdated?: string
  platform?: string
}

// Thin facade over the notify-broadcast Edge Function. Server (Edge Function)
// owns FCM access; the client just authorizes and forwards.
export class NotificationService {
  static async getUserFCMToken(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("fcm_tokens")
      .select("fcm_token")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error("getUserFCMToken error:", error)
      return null
    }
    return data?.fcm_token ?? null
  }

  static async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    const timestamp = new Date().toISOString()
    const { data, error } = await supabase.functions.invoke("notify-broadcast", {
      body: {
        user_id: userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
    })
    if (error) {
      return { success: false, error: error.message, timestamp }
    }
    const sent = (data as { sent?: number })?.sent ?? 0
    if (sent === 0) {
      return { success: false, error: "No devices reached", timestamp }
    }
    return { success: true, timestamp }
  }

  static async sendInfluencerApprovalNotification(
    userId: string,
    isApproved: boolean,
    influencerName?: string,
    niche?: string,
  ): Promise<NotificationResult> {
    const payload: NotificationPayload = isApproved
      ? {
          title: "🎉 Application Approved!",
          body: `Congratulations${influencerName ? ` ${influencerName}` : ""}! Your influencer application has been approved.`,
          data: {
            type: "influencer_approved",
            action: "view_profile",
            niche: niche || "",
          },
        }
      : {
          title: "Application Update",
          body: `Your influencer application was not approved at this time.`,
          data: { type: "influencer_rejected", action: "view_guidelines" },
        }
    return this.sendNotificationToUser(userId, payload)
  }

  static async sendNotificationToMultipleUsers(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<{ success: string[]; failed: string[]; results: NotificationResult[] }> {
    const results = await Promise.all(
      userIds.map((id) => this.sendNotificationToUser(id, payload).then((r) => ({ id, r }))),
    )
    return {
      success: results.filter((x) => x.r.success).map((x) => x.id),
      failed: results.filter((x) => !x.r.success).map((x) => x.id),
      results: results.map((x) => x.r),
    }
  }

  static async testNotification(userId: string): Promise<NotificationResult> {
    return this.sendNotificationToUser(userId, {
      title: "🧪 Test Notification",
      body: "This is a test notification from the Cliqit Super Admin panel.",
      data: { type: "test", action: "test" },
    })
  }

  static async getUserNotificationStats(userId: string): Promise<UserNotificationStats> {
    const { data, error } = await supabase
      .from("fcm_tokens")
      .select("platform, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error("getUserNotificationStats error:", error)
      return { hasToken: false }
    }
    if (!data) return { hasToken: false }
    return {
      hasToken: true,
      lastUpdated: data.updated_at,
      platform: data.platform ?? undefined,
    }
  }
}
