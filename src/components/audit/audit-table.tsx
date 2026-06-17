"use client"

import * as React from "react"
import Link from "next/link"
import { FileSearch } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/remote-avatar"
import { AuditDiff } from "@/components/audit/audit-diff"
import { formatDateTime } from "@/lib/utils"
import type { AuditEntry } from "@/data/audit"

// ── Action badge ─────────────────────────────────────────────────────────────

function actionBadgeVariant(
  action: string
): "success" | "destructive" | "warning" | "default" {
  const lower = action.toLowerCase()
  if (/\.(verify|approve|restore)$/.test(lower)) return "success"
  if (/\.(delete|soft_delete)$/.test(lower)) return "destructive"
  if (/\.role_change$/.test(lower)) return "warning"
  return "default"
}

// ── Target link ──────────────────────────────────────────────────────────────

function TargetLink({
  targetType,
  targetId,
}: {
  targetType: string | null
  targetId: string | null
}) {
  if (!targetType || !targetId)
    return <span className="text-gray-400 text-xs italic">—</span>

  const hrefMap: Record<string, string> = {
    user: `/dashboard/users/${targetId}`,
    gig: `/dashboard/gigs/${targetId}`,
    event: `/dashboard/events/${targetId}`,
    application: `/dashboard/applications/${targetId}`,
    business: `/dashboard/businesses/${targetId}`,
    content_submission: `/dashboard/content/${targetId}`,
    community_post: `/dashboard/community/${targetId}`,
  }

  const href = hrefMap[targetType]
  const label = (
    <span className="font-mono text-xs">
      {targetType} / {targetId.slice(0, 8)}…
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="text-blue-600 hover:underline">
        {label}
      </Link>
    )
  }
  return (
    <span>
      {targetType} / <span className="font-mono text-xs">{targetId.slice(0, 8)}…</span>
    </span>
  )
}

// ── Actor cell ───────────────────────────────────────────────────────────────

function ActorCell({ entry }: { entry: AuditEntry }) {
  if (!entry.actor && !entry.actorId) {
    return <span className="text-gray-400 italic text-xs">System</span>
  }
  const name = entry.actor?.displayName ?? entry.actorId?.slice(0, 8) + "…"
  return (
    <div className="flex items-center gap-2">
      <RemoteAvatar src={entry.actor?.avatarUrl} size={28} alt={name ?? "Actor"} />
      <span className="text-sm truncate max-w-[120px]">{name}</span>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

interface AuditTableProps {
  entries: AuditEntry[]
  total: number
  page: number
  limit: number
  isLoading?: boolean
  onPageChange: (page: number) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function AuditTable({
  entries,
  total,
  page,
  limit,
  isLoading = false,
  onPageChange,
}: AuditTableProps) {
  const [diffEntry, setDiffEntry] = React.useState<AuditEntry | null>(null)
  const [diffOpen, setDiffOpen] = React.useState(false)

  const pageCount = Math.ceil(total / limit)
  const from = page * limit + 1
  const to = Math.min((page + 1) * limit, total)

  function openDiff(entry: AuditEntry) {
    setDiffEntry(entry)
    setDiffOpen(true)
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Actor</TableHead>
              <TableHead className="w-[200px]">Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[64px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                  Loading…
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <ActorCell entry={entry} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionBadgeVariant(entry.action)}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TargetLink
                      targetType={entry.targetType}
                      targetId={entry.targetId}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    {(entry.before !== null || entry.after !== null) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View diff"
                        onClick={() => openDiff(entry)}
                      >
                        <FileSearch className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          {total === 0
            ? "No entries"
            : `Showing ${from}–${to} of ${total} entries`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1 || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AuditDiff
        entry={diffEntry}
        open={diffOpen}
        onOpenChange={setDiffOpen}
      />
    </>
  )
}
