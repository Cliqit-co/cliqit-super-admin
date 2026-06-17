"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { resolveStorageUrl } from "@/lib/storage"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  type BusinessDetail,
  setBusinessVerified,
  setBusinessSuspended,
} from "@/data/businesses"
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react"

interface BusinessDetailProps {
  business: BusinessDetail
  onRefresh: () => void
}

// ── Minimal confirm dialog (Wave 1 will provide the real one; this is a local
//    guard that covers the destructive actions in this component) ──────────────
function useConfirm() {
  return function confirm(message: string): boolean {
    // In a full W1 environment this would be a modal; window.confirm is the
    // fallback until ConfirmDialog is available in shared components.
    return window.confirm(message)
  }
}

// ── Status badge helpers ──────────────────────────────────────────────────────

function GigStatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "success" | "secondary" | "destructive" | "warning" | "outline"> = {
    draft: "secondary",
    active: "success",
    completed: "outline",
    cancelled: "destructive",
  }
  return <Badge variant={map[status] ?? "secondary"} className="capitalize">{status}</Badge>
}

function EventStatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "success" | "secondary" | "destructive" | "warning" | "outline"> = {
    draft: "secondary",
    active: "success",
    upcoming: "default",
    ongoing: "warning",
    completed: "outline",
    cancelled: "destructive",
  }
  return <Badge variant={map[status] ?? "secondary"} className="capitalize">{status}</Badge>
}

// ── Simple tab state ───────────────────────────────────────────────────────────

type Tab = "overview" | "gigs" | "events"

// ── Main component ─────────────────────────────────────────────────────────────

export function BusinessDetailView({ business, onRefresh }: BusinessDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const confirm = useConfirm()

  const isSuspended = !!business.userDeletedAt
  const isVerified = !!business.verifiedAt

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleVerify() {
    const action = isVerified ? "unverify" : "verify"
    const ok = confirm(
      isVerified
        ? `Remove verification badge from "${business.businessName}"? This is a silent action (no push notification).`
        : `Mark "${business.businessName}" as a verified business? This is a silent action (no push notification).`
    )
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      await setBusinessVerified(business.userId, !isVerified)
      showSuccess(
        isVerified
          ? "Business verification removed."
          : "Business verified successfully."
      )
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} business.`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSuspend() {
    if (!isSuspended) {
      // Suspending — warn about live gigs
      const ok = confirm(
        `Suspend "${business.businessName}"?\n\n` +
          `WARNING: Suspending this user does NOT automatically cancel their active gigs or events. ` +
          `You must handle those separately.\n\nThis is a silent action (no push notification).`
      )
      if (!ok) return
    } else {
      const ok = confirm(
        `Restore access for "${business.businessName}"? This will re-activate their account.`
      )
      if (!ok) return
    }

    setLoading(true)
    setError(null)
    try {
      await setBusinessSuspended(business.userId, !isSuspended)
      showSuccess(isSuspended ? "Business restored successfully." : "Business suspended.")
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update suspension status.")
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "gigs", label: "Gigs", count: business.gigs.length },
    { key: "events", label: "Events", count: business.events.length },
  ]

  return (
    <div className="space-y-6">
      {/* Feedback banners */}
      {success && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-md text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <RemoteAvatar
              src={business.logoUrl}
              alt={business.businessName ?? "Business"}
              size={72}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">
                  {business.businessName ?? <span className="text-muted-foreground italic">Unnamed Business</span>}
                </h2>
                {isVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="secondary">Unverified</Badge>
                )}
                {isSuspended && <Badge variant="destructive">Suspended</Badge>}
              </div>
              {business.category && (
                <Badge variant="outline" className="capitalize mb-2">{business.category}</Badge>
              )}
              {business.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {business.description}
                </p>
              )}
            </div>
            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                variant={isVerified ? "outline" : "default"}
                size="sm"
                onClick={handleVerify}
                disabled={loading}
                className={isVerified ? "text-red-600 border-red-200 hover:bg-red-50" : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {isVerified ? (
                  <><XCircle className="h-4 w-4 mr-1" /> Unverify</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Verify</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSuspend}
                disabled={loading}
                className={
                  isSuspended
                    ? "text-green-700 border-green-300 hover:bg-green-50"
                    : "text-orange-600 border-orange-200 hover:bg-orange-50"
                }
              >
                {isSuspended ? (
                  <><ShieldCheck className="h-4 w-4 mr-1" /> Restore</>
                ) : (
                  <><ShieldOff className="h-4 w-4 mr-1" /> Suspend</>
                )}
              </Button>
            </div>
          </div>

          {/* Live-gig warning when suspended */}
          {isSuspended && business.gigs.some((g) => g.status === "active") && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
              <span>
                This business is suspended but still has{" "}
                <strong>active gigs</strong>. Consider reviewing them separately.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab bar */}
      <div className="border-b flex gap-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab business={business} />
      )}
      {activeTab === "gigs" && (
        <GigsTab business={business} />
      )}
      {activeTab === "events" && (
        <EventsTab business={business} />
      )}
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ business }: { business: BusinessDetail }) {
  const coverUrl = resolveStorageUrl(business.coverImageUrl)

  return (
    <div className="space-y-4">
      {/* Cover image */}
      {coverUrl && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <img
              src={coverUrl}
              alt="Cover"
              className="w-full h-48 object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Contact & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Email" value={business.emailUser ?? business.email ?? "—"} />
            <InfoRow label="Phone" value={business.phoneNumberUser ?? business.phoneNumber ?? "—"} />
            {business.websiteUrl && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={business.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {business.websiteUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="City" value={business.city ?? "—"} />
            <InfoRow label="State" value={business.state ?? "—"} />
            <InfoRow label="Pin Code" value={business.pinCode ?? "—"} />
            {business.address && (
              <InfoRow label="Address" value={business.address} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Profile Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoRow label="User ID" value={business.userId} mono />
          <InfoRow label="Joined" value={formatDate(business.createdAt)} />
          <InfoRow label="Last Updated" value={formatDate(business.updatedAt)} />
          {business.verifiedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-muted-foreground">Verified on</span>
              <span>{formatDateTime(business.verifiedAt)}</span>
            </div>
          )}
          {business.userDeletedAt && (
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-muted-foreground">Suspended since</span>
              <span>{formatDateTime(business.userDeletedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      {Array.isArray(business.photos) && business.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" /> Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(business.photos as string[]).map((p, i) => {
                const url = resolveStorageUrl(p)
                return url ? (
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="rounded-md object-cover aspect-square w-full"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : null
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social links */}
      {business.socialLinks && Object.keys(business.socialLinks).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(business.socialLinks).map(([key, val]) => {
                if (typeof val !== "string" || !val.trim()) return null
                const href = val.startsWith("http") ? val : `https://${val}`
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge variant="outline" className="capitalize">{key}</Badge>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Gigs tab ──────────────────────────────────────────────────────────────────

function GigsTab({ business }: { business: BusinessDetail }) {
  const gigs = business.gigs
  if (gigs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No gigs found for this business.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {gigs.map((g) => (
        <Card key={g.id}>
          <CardContent className="py-4 flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{g.title}</span>
                <GigStatusBadge status={g.status} />
                {g.deletedAt && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="capitalize">{g.compensationType}</span>
                {g.compensationAmount != null && (
                  <span>${g.compensationAmount.toLocaleString()}</span>
                )}
                {g.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {g.city}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Calendar className="h-3 w-3" />
              {formatDate(g.createdAt)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Events tab ────────────────────────────────────────────────────────────────

function EventsTab({ business }: { business: BusinessDetail }) {
  const events = business.events
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No events found for this business.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {events.map((e) => (
        <Card key={e.id}>
          <CardContent className="py-4 flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{e.title}</span>
                <EventStatusBadge status={e.status} />
                {e.deletedAt && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {e.eventDateTime && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(e.eventDateTime)}
                  </span>
                )}
                {e.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {e.city}
                  </span>
                )}
                {e.capacity != null ? (
                  <span>Capacity: {e.capacity}</span>
                ) : (
                  <span>Unlimited</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Calendar className="h-3 w-3" />
              {formatDate(e.createdAt)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-foreground shrink-0 w-24">{label}</span>
      <span className={mono ? "font-mono text-xs break-all" : ""}>{value}</span>
    </div>
  )
}

// Export Phone for tree-shaking (it is imported from lucide but only used once
// inline — keep the import tidy)
export { Phone }
