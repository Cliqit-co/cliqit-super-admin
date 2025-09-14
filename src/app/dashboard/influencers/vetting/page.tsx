"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { InfluencerDetailsModal } from "@/components/dashboard/influencer-details-modal"
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react"

// Mock data - replace with actual data from your API
const mockInfluencers = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@example.com",
    phone: "+91 9876543210",
    city: "Mumbai",
    audienceSize: "100K - 500K",
    niche: "Fashion",
    instagramUsername: "@sarahjohnson_fashion",
    status: "pending",
    appliedAt: "2024-01-15",
    mailingListSubscribed: true,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 125000, engagement: 4.2 }
    ]
  },
  {
    id: "2",
    firstName: "Mike",
    lastName: "Chen",
    email: "mike@example.com",
    phone: "+91 9876543211",
    city: "Bangalore",
    audienceSize: "50K - 100K",
    niche: "Tech",
    instagramUsername: "@mikechen_tech",
    status: "under_review",
    appliedAt: "2024-01-14",
    mailingListSubscribed: false,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 89000, engagement: 3.8 }
    ]
  },
  {
    id: "3",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma@example.com",
    phone: "+91 9876543212",
    city: "Delhi",
    audienceSize: "500K - 1M",
    niche: "Makeup",
    instagramUsername: "@emmadavis_beauty",
    status: "pending",
    appliedAt: "2024-01-13",
    mailingListSubscribed: true,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 250000, engagement: 5.1 }
    ]
  },
  {
    id: "4",
    firstName: "Alex",
    lastName: "Rodriguez",
    email: "alex@example.com",
    phone: "+91 9876543213",
    city: "Pune",
    audienceSize: "25K - 50K",
    niche: "Gaming",
    instagramUsername: "@alexrodriguez_gaming",
    status: "pending",
    appliedAt: "2024-01-12",
    mailingListSubscribed: false,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 45000, engagement: 6.2 }
    ]
  },
  {
    id: "5",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya@example.com",
    phone: "+91 9876543214",
    city: "Bangalore",
    audienceSize: "1M+",
    niche: "Foodie",
    instagramUsername: "@priyasharma_food",
    status: "pending",
    appliedAt: "2024-01-11",
    mailingListSubscribed: true,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 1200000, engagement: 7.8 }
    ]
  },
  {
    id: "6",
    firstName: "Rahul",
    lastName: "Patel",
    email: "rahul@example.com",
    phone: "+91 9876543215",
    city: "Delhi",
    audienceSize: "10K - 25K",
    niche: "Artist",
    instagramUsername: "@rahulpatel_art",
    status: "pending",
    appliedAt: "2024-01-10",
    mailingListSubscribed: false,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 18000, engagement: 8.5 }
    ]
  },
  {
    id: "7",
    firstName: "Ananya",
    lastName: "Singh",
    email: "ananya@example.com",
    phone: "+91 9876543216",
    city: "Mumbai",
    audienceSize: "500K - 1M",
    niche: "Lifestyle",
    instagramUsername: "@ananyasingh_lifestyle",
    status: "pending",
    appliedAt: "2024-01-09",
    mailingListSubscribed: true,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 750000, engagement: 6.3 }
    ]
  },
  {
    id: "8",
    firstName: "Vikram",
    lastName: "Kumar",
    email: "vikram@example.com",
    phone: "+91 9876543217",
    city: "Pune",
    audienceSize: "5K - 10K",
    niche: "Sports",
    instagramUsername: "@vikramkumar_sports",
    status: "pending",
    appliedAt: "2024-01-08",
    mailingListSubscribed: false,
    termsAccepted: true,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    socialMedia: [
      { platform: "instagram", followers: 8500, engagement: 9.2 }
    ]
  }
]

export default function InfluencerVettingPage() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null)
  const [influencers, setInfluencers] = useState(mockInfluencers)

  const pendingCount = influencers.filter(i => i.status === "pending").length
  const underReviewCount = influencers.filter(i => i.status === "under_review").length

  const handleApprove = (id: string) => {
    setInfluencers(prev => prev.map(inf => 
      inf.id === id ? { ...inf, status: "approved" } : inf
    ))
  }

  const handleReject = (id: string) => {
    setInfluencers(prev => prev.map(inf => 
      inf.id === id ? { ...inf, status: "rejected" } : inf
    ))
  }

  const handleHold = (id: string) => {
    setInfluencers(prev => prev.map(inf => 
      inf.id === id ? { ...inf, status: "under_review" } : inf
    ))
  }

  const selectedInfluencerData = influencers.find(inf => inf.id === selectedInfluencer)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Influencer Vetting</h1>
        <p className="text-muted-foreground">
          Review and approve influencer applications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting initial review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently being reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Influencer Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="p-6 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-lg">{influencer.firstName} {influencer.lastName}</h3>
                        <StatusBadge status={influencer.status} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div>
                          <p><strong>Email:</strong> {influencer.email}</p>
                          <p><strong>Phone:</strong> {influencer.phone}</p>
                          <p><strong>City:</strong> {influencer.city}</p>
                        </div>
                        <div>
                          <p><strong>Audience Size:</strong> {influencer.audienceSize}</p>
                          <p><strong>Niche:</strong> {influencer.niche}</p>
                          <p><strong>Instagram:</strong> {influencer.instagramUsername}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{influencer.socialMedia[0]?.followers?.toLocaleString()} followers</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{influencer.socialMedia[0]?.engagement}% engagement</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Applied: {new Date(influencer.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {influencer.mailingListSubscribed && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Mailing List
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInfluencer(influencer.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {influencer.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(influencer.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(influencer.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Influencer Details Modal */}
      {selectedInfluencerData && (
        <InfluencerDetailsModal
          influencer={selectedInfluencerData}
          isOpen={!!selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onHold={handleHold}
        />
      )}
    </div>
  )
}
