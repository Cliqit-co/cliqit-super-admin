"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { 
  X,
  CheckCircle,
  XCircle,
  User,
  Mail,
  MapPin,
  Users,
  Instagram,
  CheckSquare,
  Square,
  AlertCircle,
  Star,
} from "lucide-react"
import { type InfluencerProfile } from "@/data/influencers"

interface InfluencerDetailsModalProps {
  influencer: InfluencerProfile & {
    phone?: string
    status?: string
    appliedAt?: string
    mailingListSubscribed?: boolean
  }
  isOpen: boolean
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isUpdating?: boolean
}

function buildInstagramUrl(links?: Record<string, unknown> | null): string | undefined {
  if (!links) return undefined
  const keys = ["instagram", "instagramUrl", "instagram_url", "ig", "instagramHandle", "instagram_handle"]
  for (const k of keys) {
    const v = links[k]
    if (typeof v === "string" && v.trim()) {
      const s = v.trim()
      if (s.startsWith("http://") || s.startsWith("https://")) return s
      const username = s.replace(/^@/, "")
      return `https://instagram.com/${username}`
    }
  }
  return undefined
}

function extractInstagramUsername(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const username = pathname.split('/').filter(Boolean)[0]
    return username || ''
  } catch {
    // Fallback: extract from URL string
    const match = url.match(/instagram\.com\/([^\/\?]+)/)
    return match ? match[1] : ''
  }
}

export function InfluencerDetailsModal({
  influencer,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isUpdating = false
}: InfluencerDetailsModalProps) {
  const [reviewNotes, setReviewNotes] = useState("")
  const [vettingScore, setVettingScore] = useState<number | null>(null)

  const instagramUrl = useMemo(() => buildInstagramUrl(influencer.socialLinks), [influencer.socialLinks])

  if (!isOpen) return null

  const handleApprove = () => {
    onApprove(influencer.id)
  }

  const handleUnapprove = () => {
    const confirmed = window.confirm(
      "Are you sure you want to unapprove this user? This will revoke their verified status."
    )
    if (confirmed) {
      onApprove(influencer.id) // Same function, just different context
    }
  }

  const handleReject = () => {
    onReject(influencer.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Influencer Profile</h2>
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {typeof influencer.status === "string" && <StatusBadge status={influencer.status} />}
                  <Badge variant={influencer.verifiedUser ? "success" : "secondary"} className="text-xs">{influencer.verifiedUser ? "Verified" : "Unverified"}</Badge>
                  <Badge variant={influencer.emailVerified ? "success" : "warning"} className="text-xs">{influencer.emailVerified ? "Email Verified" : "Email Unverified"}</Badge>
                  <Badge variant={influencer.acceptedTerms ? "success" : "warning"} className="text-xs">{influencer.acceptedTerms ? "Terms Accepted" : "Terms Missing"}</Badge>
                  <Badge variant={influencer.acceptedPrivacy ? "success" : "warning"} className="text-xs">{influencer.acceptedPrivacy ? "Privacy Accepted" : "Privacy Missing"}</Badge>
                  {influencer.appliedAt && (
                    <Badge variant="outline" className="text-xs">
                      Applied: {new Date(influencer.appliedAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2"><Instagram className="h-4 w-4" /> Instagram</Button>
              </a>
            )}
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
                  {influencer.city && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">City:</span>
                      <span>{influencer.city}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Audience Size:</span>
                    <span>{influencer.audienceSize || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Niche:</span>
                    <Badge variant="secondary">{influencer.niche || '-'}</Badge>
                  </div>
                </div>
              </div>
              {influencer.bio && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">Bio</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{influencer.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          {Array.isArray(influencer.categories) && influencer.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {influencer.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="capitalize">{cat}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram Profile Embed */}
          {instagramUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Instagram className="h-5 w-5" />
                  <span>Instagram Profile</span>
                  <a 
                    href={instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto text-sm text-blue-600 hover:underline"
                  >
                    View on Instagram →
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  <iframe
                    src={`https://www.instagram.com/${extractInstagramUsername(instagramUrl)}/embed/`}
                    width="100%"
                    height="400"
                    frameBorder="0"
                    scrolling="no"
                    allowTransparency={true}
                    className="rounded-lg border"
                    title={`Instagram profile for ${influencer.username}`}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agreements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Agreements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  {influencer.acceptedTerms ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Terms & Conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  {influencer.acceptedPrivacy ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Privacy Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  {influencer.emailVerified ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Email Verified</span>
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
              onClick={handleReject}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isUpdating ? "Updating..." : "Reject Application"}
            </Button>
            {influencer.verifiedUser ? (
              <Button
                onClick={handleUnapprove}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isUpdating ? "Updating..." : "Unapprove User"}
              </Button>
            ) : (
              <Button
                onClick={handleApprove}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isUpdating ? "Updating..." : "Approve Application"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
