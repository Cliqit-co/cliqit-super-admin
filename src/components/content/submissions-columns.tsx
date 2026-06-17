"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Video,
  ExternalLink,
  MoreHorizontal,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { ContentSubmission } from "@/data/content-submissions"
import { RemoteAvatar } from "@/components/remote-avatar"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function PlatformIcon({ platform }: { platform: string }) {
  const size = "h-4 w-4"
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className={size} />
    case "youtube":
      return <Youtube className={size} />
    case "twitter":
      return <Twitter className={size} />
    case "facebook":
      return <Facebook className={size} />
    case "tiktok":
      return <Video className={size} />
    default:
      return null
  }
}

function platformColor(platform: string): "default" | "secondary" | "info" | "destructive" | "warning" | "success" | "outline" {
  switch (platform.toLowerCase()) {
    case "instagram":
      return "warning"
    case "youtube":
      return "destructive"
    case "twitter":
      return "info"
    case "tiktok":
      return "secondary"
    case "facebook":
      return "info"
    default:
      return "outline"
  }
}

interface SubmissionActionsProps {
  submission: ContentSubmission
  onApprove: (submission: ContentSubmission) => void
  onReject: (submission: ContentSubmission) => void
}

function SubmissionActions({ submission, onApprove, onReject }: SubmissionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/content/${submission.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View detail
          </Link>
        </DropdownMenuItem>
        {submission.status === "pending_review" && (
          <>
            <DropdownMenuItem
              className="text-green-600"
              onClick={() => onApprove(submission)}
            >
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onReject(submission)}
            >
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function createSubmissionsColumns(
  onApprove: (submission: ContentSubmission) => void,
  onReject: (submission: ContentSubmission) => void
): ColumnDef<ContentSubmission>[] {
  return [
    {
      id: "influencer",
      header: "Influencer",
      cell: ({ row }) => {
        const { influencer } = row.original
        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            <RemoteAvatar src={influencer?.avatarUrl} size={32} />
            <span className="font-medium text-sm">
              {influencer?.displayName ?? "Unknown"}
            </span>
          </div>
        )
      },
    },
    {
      id: "platform",
      header: "Platform",
      cell: ({ row }) => {
        const { platform } = row.original
        return (
          <Badge variant={platformColor(platform)} className="flex items-center gap-1 w-fit">
            <PlatformIcon platform={platform} />
            <span className="capitalize">{platform}</span>
          </Badge>
        )
      },
    },
    {
      id: "content_url",
      header: "Content",
      cell: ({ row }) => {
        const { contentUrl } = row.original
        return (
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline text-sm max-w-[200px] truncate"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{contentUrl}</span>
          </a>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "submitted_at",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatDate(row.original.submittedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <SubmissionActions
          submission={row.original}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
    },
  ]
}
