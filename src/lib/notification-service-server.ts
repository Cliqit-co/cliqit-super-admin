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

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

/**
 * Server-side notification service for Firebase Admin SDK operations
 * This file should only be imported in server-side code (API routes, etc.)
 */
export class ServerNotificationService {
  /**
   * Send notification via Firebase Admin SDK
   */
  static async sendNotification(fcmToken: string, payload: NotificationPayload): Promise<NotificationResult> {
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
          notification: {
            sound: 'default',
            channelId: 'default',
          },
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
      console.log('✅ Successfully sent notification:', response)
      
      return {
        success: true,
        messageId: response,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle specific Firebase errors
        if (error.message.includes('registration-token-not-registered')) {
          errorMessage = 'FCM token is no longer valid'
        } else if (error.message.includes('invalid-registration-token')) {
          errorMessage = 'Invalid FCM token format'
        } else if (error.message.includes('quota-exceeded')) {
          errorMessage = 'Firebase quota exceeded'
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Validate FCM token format
   */
  static isValidFCMToken(token: string): boolean {
    // Basic FCM token validation
    return token && 
           token.length > 100 && 
           token.length < 200 && 
           /^[A-Za-z0-9_-]+$/.test(token)
  }
}


















