import { graphqlRequest } from './graphql-client'

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface NotificationOptions {
  userId?: string
  userRole?: string
  topic?: string
  scheduledTime?: Date
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

export class NotificationService {
  private static readonly QUERY_USER_FCM_TOKEN = `
    query GetUserFCMToken($user_id: uuid!) {
      fcm_tokens(where: {user_id: {_eq: $user_id}}, order_by: {updated_at: desc}, limit: 1) {
        fcm_token
        platform
        updated_at
      }
    }
  `

  private static readonly MUTATION_LOG_NOTIFICATION = `
    mutation LogNotification($user_id: uuid!, $notification_type: String!, $title: String!, $body: String!, $success: Boolean!, $error_message: String) {
      insert_notification_history_one(object: {
        user_id: $user_id,
        notification_type: $notification_type,
        title: $title,
        body: $body,
        success: $success,
        error_message: $error_message
      }) {
        id
      }
    }
  `

  /**
   * 🔍 Get user's FCM token from database
   */
  static async getUserFCMToken(userId: string): Promise<string | null> {
    try {
      console.log('🔍 Fetching FCM token for user:', userId)
      
      const result = await graphqlRequest<{
        fcm_tokens: Array<{
          fcm_token: string
          platform?: string
          updated_at: string
        }>
      }>(this.QUERY_USER_FCM_TOKEN, { user_id: userId })

      const token = result.fcm_tokens?.[0]?.fcm_token
      
      if (token) {
        console.log('✅ FCM token found for user:', userId)
        return token
      } else {
        console.log('⚠️ No FCM token found for user:', userId)
        return null
      }
    } catch (error) {
      console.error('❌ Error fetching FCM token:', error)
      return null
    }
  }

  /**
   * 📱 Send notification to a specific user by user ID
   */
  static async sendNotificationToUser(
    userId: string, 
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    const timestamp = new Date().toISOString()
    
    try {
      console.log('📱 Sending notification to user:', userId)
      
      // Get user's FCM token
      const fcmToken = await this.getUserFCMToken(userId)
      
      if (!fcmToken) {
        const error = 'No FCM token found for user'
        console.warn('⚠️', error)
        
        // Log failed notification
        await this.logNotification(userId, 'user_notification', payload, false, error)
        
        return {
          success: false,
          error,
          timestamp
        }
      }

      // Validate FCM token format
      if (!this.isValidFCMToken(fcmToken)) {
        const error = 'Invalid FCM token format'
        console.error('❌', error)
        
        await this.logNotification(userId, 'user_notification', payload, false, error)
        
        return {
          success: false,
          error,
          timestamp
        }
      }

      // Send notification via API
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken,
          payload
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Notification sent successfully to user:', userId)
        await this.logNotification(userId, 'user_notification', payload, true)
        
        return {
          success: true,
          messageId: result.messageId,
          timestamp
        }
      } else {
        console.error('❌ Failed to send notification:', result.error)
        await this.logNotification(userId, 'user_notification', payload, false, result.error)
        
        return {
          success: false,
          error: result.error,
          timestamp
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error sending notification:', errorMessage)
      
      await this.logNotification(userId, 'user_notification', payload, false, errorMessage)
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      }
    }
  }

  /**
   * 🎉 Send influencer approval notification
   */
  static async sendInfluencerApprovalNotification(
    userId: string, 
    isApproved: boolean,
    influencerName?: string,
    niche?: string
  ): Promise<NotificationResult> {
    const payload: NotificationPayload = isApproved 
      ? {
          title: "🎉 Application Approved!",
          body: `Congratulations${influencerName ? ` ${influencerName}` : ''}! Your influencer application has been approved. You can now start applying for gigs!`,
          data: {
            type: 'influencer_approved',
            action: 'view_profile',
            niche: niche || ''
          }
        }
      : {
          title: "Application Update",
          body: `Your influencer application was not approved at this time. Please review our guidelines and try again.`,
          data: {
            type: 'influencer_rejected',
            action: 'view_guidelines'
          }
        }

    return await this.sendNotificationToUser(userId, payload)
  }

  /**
   * 📊 Send notification to multiple users
   */
  static async sendNotificationToMultipleUsers(
    userIds: string[], 
    payload: NotificationPayload
  ): Promise<{success: string[], failed: string[], results: NotificationResult[]}> {
    console.log('📊 Sending notifications to multiple users:', userIds.length)
    
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.sendNotificationToUser(userId, payload)
        return { userId, result }
      })
    )

    const success = results.filter(r => r.result.success).map(r => r.userId)
    const failed = results.filter(r => !r.result.success).map(r => r.userId)
    
    console.log(`✅ Success: ${success.length}, ❌ Failed: ${failed.length}`)
    
    return {
      success,
      failed,
      results: results.map(r => r.result)
    }
  }

  /**
   * 🧪 Test notification for a user
   */
  static async testNotification(userId: string): Promise<NotificationResult> {
    const payload: NotificationPayload = {
      title: "🧪 Test Notification",
      body: "This is a test notification from the Cliqit Super Admin panel.",
      data: {
        type: 'test',
        action: 'test'
      }
    }

    return await this.sendNotificationToUser(userId, payload)
  }

  /**
   * 📈 Get user notification statistics
   */
  static async getUserNotificationStats(userId: string): Promise<UserNotificationStats> {
    try {
      const result = await graphqlRequest<{
        fcm_tokens: Array<{
          fcm_token: string
          platform?: string
          updated_at: string
        }>
      }>(this.QUERY_USER_FCM_TOKEN, { user_id: userId })

      const tokenData = result.fcm_tokens?.[0]
      
      return {
        hasToken: !!tokenData,
        lastUpdated: tokenData?.updated_at,
        platform: tokenData?.platform
      }
    } catch (error) {
      console.error('❌ Error fetching notification stats:', error)
      return { hasToken: false }
    }
  }

  /**
   * ✅ Validate FCM token format
   */
  private static isValidFCMToken(token: string): boolean {
    // Basic FCM token validation
    return token && 
           token.length > 100 && 
           token.length < 200 && 
           /^[A-Za-z0-9_-]+$/.test(token)
  }

  /**
   * 📝 Log notification to database
   */
  private static async logNotification(
    userId: string,
    notificationType: string,
    payload: NotificationPayload,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await graphqlRequest(this.MUTATION_LOG_NOTIFICATION, {
        user_id: userId,
        notification_type: notificationType,
        title: payload.title,
        body: payload.body,
        success,
        error_message: errorMessage
      })
    } catch (error) {
      console.error('❌ Error logging notification:', error)
    }
  }

  /**
   * 🔄 Legacy methods for backward compatibility
   */
  static async sendToUser(fcmToken: string, payload: NotificationPayload) {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken, payload })
    })
    return response.json()
  }

  static async sendToTopic(topic: string, payload: NotificationPayload) {
    // Topic-based notifications would require additional implementation
    console.log('📢 Topic notifications not implemented yet:', topic)
    return { success: false, error: 'Topic notifications not implemented' }
  }
}
