import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const firebaseAdmin = admin

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

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  static async sendToUser(
    fcmToken: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      }

      const response = await firebaseAdmin.messaging().send(message)
      console.log('Successfully sent message:', response)
      return response
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToMultipleUsers(
    fcmTokens: string[],
    payload: NotificationPayload,
    options?: NotificationOptions
  ) {
    try {
      const message = {
        tokens: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      }

      const response = await firebaseAdmin.messaging().sendMulticast(message)
      console.log('Successfully sent messages:', response)
      return response
    } catch (error) {
      console.error('Error sending notifications:', error)
      throw error
    }
  }

  /**
   * Send notification to a topic
   */
  static async sendToTopic(
    topic: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ) {
    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      }

      const response = await firebaseAdmin.messaging().send(message)
      console.log('Successfully sent message to topic:', response)
      return response
    } catch (error) {
      console.error('Error sending notification to topic:', error)
      throw error
    }
  }

  /**
   * Send notification to users by role
   */
  static async sendToRole(
    role: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ) {
    try {
      // This would typically query your database for users with the specified role
      // and their FCM tokens
      const topic = `role_${role}`
      return await this.sendToTopic(topic, payload, options)
    } catch (error) {
      console.error('Error sending notification to role:', error)
      throw error
    }
  }

  /**
   * Schedule a notification for later delivery
   */
  static async scheduleNotification(
    fcmToken: string,
    payload: NotificationPayload,
    scheduledTime: Date,
    options?: NotificationOptions
  ) {
    try {
      // For scheduled notifications, you would typically:
      // 1. Store the notification in your database with the scheduled time
      // 2. Use a cron job or scheduled function to send it at the right time
      // 3. Or use Firebase Cloud Messaging scheduling (if available in your region)
      
      console.log('Scheduling notification for:', scheduledTime)
      // Implementation would depend on your scheduling strategy
      return { success: true, scheduledTime }
    } catch (error) {
      console.error('Error scheduling notification:', error)
      throw error
    }
  }

  /**
   * Admin-specific notification methods
   */
  static async notifyInfluencerApproved(influencerEmail: string) {
    const payload: NotificationPayload = {
      title: 'Application Approved!',
      body: 'Congratulations! Your influencer application has been approved.',
      data: {
        type: 'influencer_approved',
        action: 'view_profile',
      },
    }

    // This would typically query for the user's FCM token
    // For now, we'll use a topic-based approach
    return await this.sendToTopic('influencer_updates', payload)
  }

  static async notifyApplicationStatusChange(applicationId: string, status: string) {
    const payload: NotificationPayload = {
      title: 'Application Status Updated',
      body: `Your application status has been updated to: ${status}`,
      data: {
        type: 'application_status',
        applicationId,
        status,
        action: 'view_application',
      },
    }

    return await this.sendToTopic('application_updates', payload)
  }

  static async notifySystemAlert(message: string, severity: 'info' | 'warning' | 'error') {
    const payload: NotificationPayload = {
      title: 'System Alert',
      body: message,
      data: {
        type: 'system_alert',
        severity,
        action: 'view_dashboard',
      },
    }

    return await this.sendToTopic('admin_alerts', payload)
  }
}
