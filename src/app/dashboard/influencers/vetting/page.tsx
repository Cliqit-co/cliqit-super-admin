"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RemoteAvatar } from "@/components/remote-avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Eye, TrendingUp, Mail, MapPin, Instagram } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchInfluencerProfiles, updateUserVerification, type InfluencerProfile } from "@/data/influencers"
import { fetchDashboardStats } from "@/data/dashboard"
import { jsonToCsv, downloadCsv } from "@/lib/csv"
import { InfluencerDetailsModal } from "@/components/dashboard/influencer-details-modal"
import { NotificationService } from "@/lib/notification-service"

export default function InfluencerVettingPage() {
  const [data, setData] = useState<InfluencerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())

  // Filters
  const [search, setSearch] = useState("")
  const [city, setCity] = useState<string>("")
  const [niche, setNiche] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [verificationFilter, setVerificationFilter] = useState<string>("all")
  const [termsOnly, setTermsOnly] = useState(false)
  const [privacyOnly, setPrivacyOnly] = useState(false)
  const [minAudience, setMinAudience] = useState<string>("")
  const [maxAudience, setMaxAudience] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // Modal state
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [stats, setStats] = useState({ pendingReviews: 0 })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetchInfluencerProfiles(),
      fetchDashboardStats()
    ])
      .then(([rows, dashboardStats]) => {
        if (!mounted) return
        setData(rows)
        setStats({ pendingReviews: dashboardStats.pendingReviews })
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || "Failed to load influencers")
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const pendingCount = stats.pendingReviews
  const underReviewCount = 0 // Status not yet implemented in backend

  const cityOptions = useMemo(() => {
    const set = new Set<string>()
    for (const i of data) {
      if (i.city) set.add(i.city)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  const nicheOptions = useMemo(() => {
    const set = new Set<string>()
    for (const i of data) {
      if (i.niche) set.add(i.niche)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const i of data) {
      for (const c of i.categories || []) set.add(c)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [data])

  function getInstagramUrl(links: Record<string, unknown> | null | undefined): string | undefined {
    if (!links) return undefined
    const anyLinks = links as Record<string, unknown>
    const candidates = [
      "instagram",
      "instagramUrl",
      "instagram_url",
      "ig",
      "instagramHandle",
      "instagram_handle",
    ]
    for (const key of candidates) {
      const raw = anyLinks[key]
      if (typeof raw === "string" && raw.trim()) {
        const val = raw.trim()
        if (val.startsWith("http://") || val.startsWith("https://")) return val
        const username = val.replace(/^@/, "")
        return `https://instagram.com/${username}`
      }
    }
    return undefined
  }

  const filteredData = useMemo(() => {
    const s = search.trim().toLowerCase()
    const minAud = minAudience ? parseInt(minAudience, 10) : undefined
    const maxAud = maxAudience ? parseInt(maxAudience, 10) : undefined
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    return data.filter((i) => {
      // search across name, username, email, city, niche
      if (s) {
        const hay = [
          i.firstName,
          i.lastName,
          i.username,
          i.email,
          i.city || "",
          i.niche || "",
          (i.categories || []).join(" "),
        ]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(s)) return false
      }

      if (city && i.city !== city) return false
      if (niche && i.niche !== niche) return false

      if (selectedCategories.length > 0) {
        const cats = new Set(i.categories || [])
        for (const c of selectedCategories) {
          if (!cats.has(c)) return false
        }
      }

      if (verificationFilter === "verified" && !i.verifiedUser) return false
      if (verificationFilter === "unverified" && i.verifiedUser) return false
      if (termsOnly && !i.acceptedTerms) return false
      if (privacyOnly && !i.acceptedPrivacy) return false

      const aud = i.audienceSize ? parseInt(i.audienceSize, 10) : undefined
      if (minAud !== undefined && (aud ?? 0) < minAud) return false
      if (maxAud !== undefined && (aud ?? 0) > maxAud) return false

      if (start || end) {
        const created = new Date(i.createdAt)
        if (start && created < start) return false
        if (end) {
          // include end date inclusive by adding 1 day at midnight
          const endInclusive = new Date(end)
          endInclusive.setDate(endInclusive.getDate() + 1)
          if (created >= endInclusive) return false
        }
      }

      return true
    })
  }, [data, search, city, niche, selectedCategories, verificationFilter, termsOnly, privacyOnly, minAudience, maxAudience, startDate, endDate])

  const handleCardClick = (influencer: InfluencerProfile) => {
    setSelectedInfluencer(influencer)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedInfluencer(null)
  }

  const handleApprove = async (id: string) => {
    setUpdatingUsers(prev => new Set(prev).add(id))
    try {
      // Find the current user to determine if we're approving or unapproving
      const currentUser = data.find(inf => inf.id === id)
      const isCurrentlyVerified = currentUser?.verifiedUser || false
      const newVerifiedStatus = !isCurrentlyVerified
      
      const success = await updateUserVerification(id, newVerifiedStatus)
      if (success) {
        // Update local state
        setData(prev => prev.map(inf => 
          inf.id === id ? { ...inf, verifiedUser: newVerifiedStatus } : inf
        ))
        
        // Also update selected influencer if it's the one we're modifying
        if (selectedInfluencer?.id === id) {
          setSelectedInfluencer(prev => prev ? { ...prev, verifiedUser: newVerifiedStatus } : null)
        }

        setError(null)
        setSuccessMessage(
          newVerifiedStatus 
            ? "Influencer approved successfully!" 
            : "Influencer unapproved successfully!"
        )
        setTimeout(() => setSuccessMessage(null), 3000)

        // Send notification to the user
        try {
          console.log('📱 Sending notification for user approval status change')
          const notificationResult = await NotificationService.sendInfluencerApprovalNotification(
            id,
            newVerifiedStatus,
            currentUser?.firstName,
            currentUser?.niche || undefined
          )
          
          if (notificationResult.success) {
            console.log('✅ Notification sent successfully')
          } else {
            console.warn('⚠️ Failed to send notification:', notificationResult.error)
            // Don't show error to user as the main action (approval) succeeded
          }
        } catch (notificationError) {
          console.error('❌ Error sending notification:', notificationError)
          // Don't show error to user as the main action (approval) succeeded
        }
      } else {
        setError(`Failed to ${newVerifiedStatus ? 'approve' : 'unapprove'} influencer`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update influencer status")
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleReject = async (id: string) => {
    setUpdatingUsers(prev => new Set(prev).add(id))
    try {
      const success = await updateUserVerification(id, false)
      if (success) {
        // Update local state
        setData(prev => prev.map(inf => 
          inf.id === id ? { ...inf, verifiedUser: false } : inf
        ))
        
        // Also update selected influencer if it's the one we're modifying
        if (selectedInfluencer?.id === id) {
          setSelectedInfluencer(prev => prev ? { ...prev, verifiedUser: false } : null)
        }

        setError(null)
        setSuccessMessage("Influencer rejected successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Send notification to the user
        try {
          console.log('📱 Sending notification for user rejection')
          const currentUser = data.find(inf => inf.id === id)
          const notificationResult = await NotificationService.sendInfluencerApprovalNotification(
            id,
            false, // rejected
            currentUser?.firstName,
            currentUser?.niche || undefined
          )
          
          if (notificationResult.success) {
            console.log('✅ Rejection notification sent successfully')
          } else {
            console.warn('⚠️ Failed to send rejection notification:', notificationResult.error)
            // Don't show error to user as the main action (rejection) succeeded
          }
        } catch (notificationError) {
          console.error('❌ Error sending rejection notification:', notificationError)
          // Don't show error to user as the main action (rejection) succeeded
        }
      } else {
        setError("Failed to reject influencer")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject influencer")
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Influencer Vetting</h1>
        <p className="text-muted-foreground">Review and approve influencer applications</p>
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
              <Input placeholder="Name, @username, email, niche..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
              <select className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Niche</label>
              <select className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm" value={niche} onChange={(e) => setNiche(e.target.value)}>
                <option value="">All</option>
                {nicheOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categories</label>
              <select
                multiple
                className="w-full min-h-[2.5rem] border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={selectedCategories}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value)
                  setSelectedCategories(values)
                }}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Removed event filters */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Min Audience</label>
                <Input type="number" inputMode="numeric" placeholder="0" value={minAudience} onChange={(e) => setMinAudience(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max Audience</label>
                <Input type="number" inputMode="numeric" placeholder="1000000" value={maxAudience} onChange={(e) => setMaxAudience(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Joined After</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Joined Before</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Verification Status</label>
              <select className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={termsOnly} onChange={(e) => setTermsOnly(e.target.checked)} />
                Accepted Terms
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" checked={privacyOnly} onChange={(e) => setPrivacyOnly(e.target.checked)} />
                Accepted Privacy
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => {
              setSearch("")
              setCity("")
              setNiche("")
              setSelectedCategories([])
              setVerificationFilter("all")
              setTermsOnly(false)
              setPrivacyOnly(false)
              setMinAudience("")
              setMaxAudience("")
              setStartDate("")
              setEndDate("")
            }}>Clear filters</Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                try {
                  // pick fields to include in CSV
                  const rows = filteredData.map((f) => ({
                    id: f.id,
                    firstName: f.firstName,
                    lastName: f.lastName,
                    username: f.username,
                    email: f.email,
                    city: f.city ?? "",
                    niche: f.niche ?? "",
                    categories: (f.categories || []).join("; "),
                    audienceSize: f.audienceSize ?? "",
                    verifiedUser: f.verifiedUser,
                    approvalStatus: f.verifiedUser ? "Approved" : "Pending Approval",
                    acceptedTerms: f.acceptedTerms,
                    acceptedPrivacy: f.acceptedPrivacy,
                    createdAt: f.createdAt,
                    updatedAt: f.updatedAt,
                    socialLinks: f.socialLinks ? JSON.stringify(f.socialLinks) : "",
                    bio: f.bio ?? "",
                  }))

                  const csv = jsonToCsv(rows, {
                    fields: [
                      "id",
                      "firstName",
                      "lastName",
                      "username",
                      "email",
                      "city",
                      "niche",
                      "categories",
                      "audienceSize",
                      "verifiedUser",
                      "approvalStatus",
                      "acceptedTerms",
                      "acceptedPrivacy",
                      "createdAt",
                      "updatedAt",
                      "socialLinks",
                      "bio",
                    ],
                    headers: {
                      id: "ID",
                      firstName: "First Name",
                      lastName: "Last Name",
                      username: "Username",
                      email: "Email",
                      city: "City",
                      niche: "Niche",
                      categories: "Categories",
                      audienceSize: "Audience Size",
                      verifiedUser: "Verified",
                      approvalStatus: "Approval Status",
                      acceptedTerms: "Accepted Terms",
                      acceptedPrivacy: "Accepted Privacy",
                      createdAt: "Created At",
                      updatedAt: "Updated At",
                      socialLinks: "Social Links",
                      bio: "Bio",
                    },
                  })

                  const ts = new Date().toISOString().replace(/[:.]/g, "-")
                  downloadCsv(csv, `influencers-${ts}.csv`)
                } catch (err) {
                  console.error("Failed to export CSV", err)
                }
              }}
            >
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting initial review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
            <p className="text-xs text-muted-foreground">Currently being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Influencer Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((inf) => (
                <div 
                  key={inf.id} 
                  className="p-6 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(inf)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <RemoteAvatar src={inf.avatarUrl || undefined} alt={inf.username} size={48} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-medium text-lg">
                            {inf.firstName} {inf.lastName}
                          </h3>
                          <span className="text-sm text-muted-foreground">@{inf.username}</span>
                          <Badge variant={inf.verifiedUser ? "success" : "secondary"}>
                            {inf.verifiedUser ? "Approved" : "Pending Approval"}
                          </Badge>
                          <Badge variant={inf.acceptedTerms ? "success" : "secondary"}>Terms</Badge>
                          <Badge variant={inf.acceptedPrivacy ? "success" : "secondary"}>Privacy</Badge>
                          {/* Instagram link */}
                          {getInstagramUrl(inf.socialLinks) && (
                            <a
                              href={getInstagramUrl(inf.socialLinks)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="gap-2">
                                <Instagram className="h-4 w-4" />
                                Instagram
                              </Button>
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-foreground">{inf.email}</span>
                            </div>
                            {inf.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="text-foreground">{inf.city}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-foreground">Joined: {new Date(inf.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium text-foreground">Audience Size:</span>{" "}
                              <span className="text-foreground">{inf.audienceSize || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Niche:</span>
                              <Badge variant="secondary">{inf.niche || "-"}</Badge>
                            </div>
                          </div>
                        </div>

                        {Array.isArray(inf.categories) && inf.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {inf.categories.slice(0, 6).map((cat) => (
                              <Badge key={cat} variant="outline" className="capitalize">
                                {cat}
                              </Badge>
                            ))}
                            {inf.categories.length > 6 && (
                              <span className="text-xs text-muted-foreground">+{inf.categories.length - 6}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.length === 0 && (
                <div className="text-sm text-muted-foreground">No influencers found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {selectedInfluencer && (
        <InfluencerDetailsModal
          influencer={selectedInfluencer}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onApprove={handleApprove}
          onReject={handleReject}
          isUpdating={updatingUsers.has(selectedInfluencer.id)}
        />
      )}
    </div>
  )
}
