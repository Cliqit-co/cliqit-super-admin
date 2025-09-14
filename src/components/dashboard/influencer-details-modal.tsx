"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Instagram,
  Calendar,
  CheckSquare,
  Square,
  AlertCircle,
  Star,
  TrendingUp
} from "lucide-react"

interface InfluencerDetailsModalProps {
  influencer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    city: string
    audienceSize: string
    niche: string
    instagramUsername: string
    status: string
    appliedAt: string
    mailingListSubscribed: boolean
    socialMedia: Array<{
      platform: string
      followers: number
      engagement: number
    }>
    // Additional fields from signup
    termsAccepted?: boolean
    privacyPolicyAccepted?: boolean
    termsOfServiceAccepted?: boolean
    password?: string // We won't display this, but it's collected
  }
  isOpen: boolean
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onHold: (id: string) => void
}

export function InfluencerDetailsModal({
  influencer,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onHold
}: InfluencerDetailsModalProps) {
  const [reviewNotes, setReviewNotes] = useState("")
  const [vettingScore, setVettingScore] = useState<number | null>(null)

  if (!isOpen) return null

  const handleApprove = () => {
    onApprove(influencer.id)
    onClose()
  }

  const handleReject = () => {
    onReject(influencer.id)
    onClose()
  }

  const handleHold = () => {
    onHold(influencer.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Influencer Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{influencer.firstName} {influencer.lastName}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusBadge status={influencer.status} />
                  <Badge variant="outline" className="text-xs">
                    Applied: {new Date(influencer.appliedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Full Name:</span>
                    <span>{influencer.firstName} {influencer.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{influencer.email}</span>
                  </div>
                  {influencer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{influencer.phone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">City:</span>
                    <span>{influencer.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Audience Size:</span>
                    <span>{influencer.audienceSize}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Niche:</span>
                    <Badge variant="secondary">{influencer.niche}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Instagram className="h-5 w-5" />
                <span>Social Media Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Instagram Username:</span>
                  <span className="text-blue-600 font-medium">{influencer.instagramUsername}</span>
                </div>
                {influencer.socialMedia.map((social, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Followers:</span>
                      <span>{social.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Engagement:</span>
                      <span>{social.engagement}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Platform:</span>
                      <Badge variant="outline" className="capitalize">{social.platform}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferences & Agreements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Preferences & Agreements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {influencer.mailingListSubscribed ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Mailing List Subscription:</span>
                  <span className={influencer.mailingListSubscribed ? "text-green-600" : "text-gray-500"}>
                    {influencer.mailingListSubscribed ? "Subscribed" : "Not Subscribed"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Terms & Conditions:</span>
                  <span className="text-green-600">Accepted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Privacy Policy:</span>
                  <span className="text-green-600">Accepted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Terms of Service:</span>
                  <span className="text-green-600">Accepted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Review & Decision</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vetting Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vettingScore || ""}
                    onChange={(e) => setVettingScore(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter score..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Add your review notes and observations..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleHold}
              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Hold for Review
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
