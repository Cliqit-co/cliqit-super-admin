"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NotificationService, NotificationResult } from "@/lib/notification-service"
import { Bell, Send, CheckCircle, XCircle, Clock, User, Smartphone } from "lucide-react"

interface NotificationTestResult {
  userId: string
  result: NotificationResult
  timestamp: string
}

export function NotificationTestPanel() {
  const [userId, setUserId] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customBody, setCustomBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<NotificationTestResult[]>([])
  const [userStats, setUserStats] = useState<{hasToken: boolean, lastUpdated?: string, platform?: string} | null>(null)

  const handleTestNotification = async () => {
    if (!userId.trim()) return
    
    setIsLoading(true)
    try {
      const result = await NotificationService.testNotification(userId.trim())
      const newResult: NotificationTestResult = {
        userId: userId.trim(),
        result,
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [newResult, ...prev.slice(0, 9)]) // Keep last 10 results
    } catch (error) {
      const errorResult: NotificationTestResult = {
        userId: userId.trim(),
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [errorResult, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomNotification = async () => {
    if (!userId.trim() || !customTitle.trim() || !customBody.trim()) return
    
    setIsLoading(true)
    try {
      const result = await NotificationService.sendNotificationToUser(userId.trim(), {
        title: customTitle.trim(),
        body: customBody.trim(),
        data: {
          type: 'custom_test',
          action: 'test'
        }
      })
      const newResult: NotificationTestResult = {
        userId: userId.trim(),
        result,
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [newResult, ...prev.slice(0, 9)])
    } catch (error) {
      const errorResult: NotificationTestResult = {
        userId: userId.trim(),
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [errorResult, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckUserStats = async () => {
    if (!userId.trim()) return
    
    try {
      const stats = await NotificationService.getUserNotificationStats(userId.trim())
      setUserStats(stats)
    } catch (error) {
      console.error('Error checking user stats:', error)
      setUserStats({ hasToken: false })
    }
  }

  const handleApprovalTest = async (isApproved: boolean) => {
    if (!userId.trim()) return
    
    setIsLoading(true)
    try {
      const result = await NotificationService.sendInfluencerApprovalNotification(
        userId.trim(),
        isApproved,
        "Test User",
        "Fashion"
      )
      const newResult: NotificationTestResult = {
        userId: userId.trim(),
        result,
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [newResult, ...prev.slice(0, 9)])
    } catch (error) {
      const errorResult: NotificationTestResult = {
        userId: userId.trim(),
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toLocaleString()
      }
      setResults(prev => [errorResult, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Testing
        </h2>
        <p className="text-muted-foreground">
          Test and manage push notifications for users
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Enter user ID..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={handleCheckUserStats}
              variant="outline"
              className="w-full"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Check FCM Token Status
            </Button>

            {userStats && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">FCM Token Status</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    Status: 
                    <Badge variant={userStats.hasToken ? "default" : "destructive"}>
                      {userStats.hasToken ? "Available" : "Not Found"}
                    </Badge>
                  </div>
                  {userStats.lastUpdated && (
                    <div>Last Updated: {new Date(userStats.lastUpdated).toLocaleString()}</div>
                  )}
                  {userStats.platform && (
                    <div>Platform: {userStats.platform}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestNotification}
              disabled={!userId.trim() || isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Notification</label>
              <Input
                placeholder="Notification title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <Input
                placeholder="Notification body..."
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
              />
              <Button 
                onClick={handleCustomNotification}
                disabled={!userId.trim() || !customTitle.trim() || !customBody.trim() || isLoading}
                variant="outline"
                className="w-full"
              >
                Send Custom Notification
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Approval Tests</label>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleApprovalTest(true)}
                  disabled={!userId.trim() || isLoading}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Test Approval
                </Button>
                <Button 
                  onClick={() => handleApprovalTest(false)}
                  disabled={!userId.trim() || isLoading}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Test Rejection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">User: {result.userId}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                  </div>
                  
                  {result.result.success ? (
                    <div className="text-sm text-green-700">
                      ✅ Notification sent successfully
                      {result.result.messageId && (
                        <div className="text-xs mt-1">Message ID: {result.result.messageId}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      ❌ Failed to send notification
                      {result.result.error && (
                        <div className="text-xs mt-1">Error: {result.result.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

