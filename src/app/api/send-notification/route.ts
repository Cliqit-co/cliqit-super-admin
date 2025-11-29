import { NextRequest, NextResponse } from 'next/server'
import { ServerNotificationService, NotificationPayload } from '@/lib/notification-service-server'

// Validate FCM token format
function isValidFCMToken(token: string): boolean {
  return ServerNotificationService.isValidFCMToken(token)
}

// Mock notification sending for development
async function sendMockNotification(fcmToken: string, payload: NotificationPayload) {
  console.log('🧪 MOCK: Sending notification')
  console.log('📱 Token:', fcmToken.substring(0, 20) + '...')
  console.log('📝 Title:', payload.title)
  console.log('📄 Body:', payload.body)
  console.log('📊 Data:', payload.data)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    timestamp: new Date().toISOString()
  }
}

// Send real notification via Firebase
async function sendRealNotification(fcmToken: string, payload: NotificationPayload) {
  return await ServerNotificationService.sendNotification(fcmToken, payload)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fcmToken, payload } = body

    // Validate request body
    if (!fcmToken || !payload) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: fcmToken and payload' 
        },
        { status: 400 }
      )
    }

    // Validate payload structure
    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payload must contain title and body' 
        },
        { status: 400 }
      )
    }

    // Validate FCM token format
    if (!isValidFCMToken(fcmToken)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid FCM token format' 
        },
        { status: 400 }
      )
    }

    // Check if Firebase is properly configured
    const isFirebaseConfigured = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    )

    let result
    if (isFirebaseConfigured) {
      console.log('🔥 Using Firebase Admin SDK')
      result = await sendRealNotification(fcmToken, payload)
    } else {
      console.log('🧪 Firebase not configured, using mock')
      result = await sendMockNotification(fcmToken, payload)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ API Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Server error: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Use POST to send notifications.' 
    },
    { status: 405 }
  )
}

