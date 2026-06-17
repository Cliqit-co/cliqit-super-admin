"use client"

import * as React from "react"
import {
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Video,
  ExternalLink,
  Hash,
  AtSign,
  CheckCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

import { ContentSubmissionDetail, reviewSubmission, updateSubmissionNotes } from "@/data/content-submissions"
import { RemoteAvatar } from "@/components/remote-avatar"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils"

// ── Platform icon ─────────────────────────────────────────────────────────

function PlatformIcon({ platform, size = 5 }: { platform: string; size?: number }) {
  const cls = `h-${size} w-${size}`
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className={cls} />
    case "youtube":
      return <Youtube className={cls} />
    case "twitter":
      return <Twitter className={cls} />
    case "facebook":
      return <Facebook className={cls} />
    case "tiktok":
      return <Video className={cls} />
    default:
      return null
  }
}

// ── Instagram embed URL builder ───────────────────────────────────────────

function buildInstagramEmbedUrl(contentUrl: string): string {
  // Accept: https://www.instagram.com/p/<shortcode>/
  //         https://www.instagram.com/reel/<shortcode>/
  const normalized = contentUrl.replace(/\/$/, "")
  return `${normalized}/embed/`
}

// ── Content preview section ───────────────────────────────────────────────

function ContentPreview({ submission }: { submission: ContentSubmissionDetail }) {
  const { platform, contentUrl } = submission
  const isInstagram = platform.toLowerCase() === "instagram"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlatformIcon platform={platform} />
          Content Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <a
          href={contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline text-sm break-all"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          {contentUrl}
        </a>
        {isInstagram && (
          <div className="aspect-[9/16] max-w-sm mx-auto rounded-md overflow-hidden border">
            <iframe
              src={buildInstagramEmbedUrl(contentUrl)}
              className="w-full h-full"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              title="Instagram embed"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Influencer remarks section ────────────────────────────────────────────

function InfluencerRemarks({ submission }: { submission: ContentSubmissionDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RemoteAvatar src={submission.influencer?.avatarUrl} size={24} />
          Influencer Remarks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submission.remarks ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.remarks}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No remarks provided.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Admin notes section ───────────────────────────────────────────────────

function AdminNotes({
  submission,
  onSaved,
}: {
  submission: ContentSubmissionDetail
  onSaved: () => void
}) {
  const [notes, setNotes] = React.useState(submission.notes ?? "")
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateSubmissionNotes(submission.id, notes.trim() || null)
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Admin Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add internal notes about this submission..."
          className="min-h-[100px]"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Notes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Instagram insights section ────────────────────────────────────────────

function InsightsPanel({ submission }: { submission: ContentSubmissionDetail }) {
  const { insights } = submission
  if (!insights) return null

  const chartData = [
    { name: "Likes", value: insights.likesCount ?? 0 },
    { name: "Comments", value: insights.commentsCount ?? 0 },
    { name: "Reach", value: insights.reach ?? 0 },
    { name: "Impressions", value: insights.impressions ?? 0 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Instagram className="h-5 w-5" />
          Instagram Insights
          {insights.requirementsMet !== null && (
            <span className="ml-auto">
              {insights.requirementsMet ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Requirements Met
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  Requirements Not Met
                </Badge>
              )}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Likes" value={insights.likesCount} />
          <StatCard label="Comments" value={insights.commentsCount} />
          <StatCard label="Reach" value={insights.reach} />
          <StatCard label="Impressions" value={insights.impressions} />
        </div>

        {/* Engagement rate */}
        {insights.engagementRate !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Engagement Rate:</span>
            <span className="font-semibold text-gray-900">
              {Number(insights.engagementRate).toFixed(2)}%
            </span>
          </div>
        )}

        {/* Bar chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v: number) => formatNumber(v)} />
              <Bar dataKey="value" fill="#9333ea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hashtags & mentions */}
        {insights.verifiedHashtags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Hash className="h-3 w-3" /> Verified Hashtags
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.verifiedHashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {insights.verifiedMentions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AtSign className="h-3 w-3" /> Verified Mentions
            </p>
            <div className="flex flex-wrap gap-1">
              {insights.verifiedMentions.map((mention) => (
                <Badge key={mention} variant="secondary" className="text-xs">
                  @{mention}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {insights.fetchedAt && (
          <p className="text-xs text-gray-400">
            Insights fetched {formatDateTime(insights.fetchedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {value !== null ? formatNumber(value) : "—"}
      </p>
    </div>
  )
}

// ── Review actions section ────────────────────────────────────────────────

interface ReviewActionsProps {
  submission: ContentSubmissionDetail
  onReviewed: () => void
}

function ReviewActions({ submission, onReviewed }: ReviewActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [action, setAction] = React.useState<"completed" | "rejected" | null>(null)
  const [loading, setLoading] = React.useState(false)

  const isPending = submission.status === "pending_review"

  function openConfirm(a: "completed" | "rejected") {
    setAction(a)
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    if (!action) return
    setLoading(true)
    try {
      await reviewSubmission(submission.id, action, submission.notes ?? null)
      setConfirmOpen(false)
      onReviewed()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isPending) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Review status:</span>
            <StatusBadge status={submission.status} />
          </div>
          {submission.notes && (
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-medium">Notes: </span>
              {submission.notes}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Reviewing will notify the influencer of the decision.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => openConfirm("completed")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </Button>
            <Button variant="destructive" onClick={() => openConfirm("rejected")}>
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={action === "completed" ? "Approve Submission" : "Reject Submission"}
        description="This will notify the influencer of the review decision."
        confirmLabel={action === "completed" ? "Approve" : "Reject"}
        destructive={action === "rejected"}
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  )
}

// ── Main SubmissionDetail export ──────────────────────────────────────────

interface SubmissionDetailProps {
  submission: ContentSubmissionDetail
  onUpdate: () => void
}

export function SubmissionDetail({ submission, onUpdate }: SubmissionDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <RemoteAvatar src={submission.influencer?.avatarUrl} size={48} />
          <div>
            <h2 className="text-lg font-semibold">
              {submission.influencer?.displayName ?? "Unknown Influencer"}
            </h2>
            <p className="text-sm text-gray-500">
              Submitted {formatDate(submission.submittedAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {/* Content preview */}
      <ContentPreview submission={submission} />

      {/* Influencer remarks */}
      <InfluencerRemarks submission={submission} />

      {/* Admin notes */}
      <AdminNotes submission={submission} onSaved={onUpdate} />

      {/* Instagram insights */}
      {submission.insights && <InsightsPanel submission={submission} />}

      {/* Review actions */}
      <ReviewActions submission={submission} onReviewed={onUpdate} />
    </div>
  )
}
