"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { AuditEntry } from "@/data/audit"

interface AuditDiffProps {
  entry: AuditEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DiffRow = {
  key: string
  before: unknown
  after: unknown
  kind: "changed" | "added" | "removed"
}

function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): DiffRow[] {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])

  const rows: DiffRow[] = []
  for (const key of allKeys) {
    const bVal = before?.[key]
    const aVal = after?.[key]
    const bStr = JSON.stringify(bVal)
    const aStr = JSON.stringify(aVal)
    if (bStr === aStr) continue

    let kind: DiffRow["kind"] = "changed"
    if (before == null || !(key in before)) kind = "added"
    else if (after == null || !(key in after)) kind = "removed"

    rows.push({ key, before: bVal, after: aVal, kind })
  }
  return rows
}

function renderValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined)
    return <span className="text-gray-400 italic">null</span>
  if (typeof val === "boolean")
    return <span className="font-mono">{val ? "true" : "false"}</span>
  if (typeof val === "object")
    return (
      <pre className="text-xs whitespace-pre-wrap break-all font-mono bg-gray-50 rounded p-1">
        {JSON.stringify(val, null, 2)}
      </pre>
    )
  return <span className="font-mono break-all">{String(val)}</span>
}

export function AuditDiff({ entry, open, onOpenChange }: AuditDiffProps) {
  const diff = React.useMemo(
    () => (entry ? computeDiff(entry.before, entry.after) : []),
    [entry]
  )

  if (!entry) return null

  const hasBeforeAfter = entry.before !== null || entry.after !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Diff — <code className="text-sm font-mono bg-gray-100 px-1 rounded">{entry.action}</code>
          </DialogTitle>
          <DialogDescription>
            {entry.targetType && entry.targetId
              ? `${entry.targetType} / ${entry.targetId}`
              : "No target recorded"}
          </DialogDescription>
        </DialogHeader>

        {!hasBeforeAfter && (
          <p className="text-sm text-gray-500 text-center py-6">
            No before/after data recorded for this action.
          </p>
        )}

        {hasBeforeAfter && diff.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            No fields changed (snapshots are identical).
          </p>
        )}

        {diff.length > 0 && (
          <div className="space-y-3 mt-2">
            {diff.map((row) => (
              <div key={row.key} className="rounded border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b">
                  <code className="text-xs font-semibold">{row.key}</code>
                  <Badge
                    variant={
                      row.kind === "added"
                        ? "success"
                        : row.kind === "removed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {row.kind}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 divide-x text-xs">
                  <div className="p-2">
                    <p className="text-gray-400 font-semibold mb-1 uppercase text-[10px] tracking-wide">
                      Before
                    </p>
                    {renderValue(row.before)}
                  </div>
                  <div className="p-2">
                    <p className="text-gray-400 font-semibold mb-1 uppercase text-[10px] tracking-wide">
                      After
                    </p>
                    {renderValue(row.after)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* raw snapshots if there's no field diff but snapshots exist */}
        {hasBeforeAfter && diff.length === 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { label: "Before", val: entry.before },
              { label: "After", val: entry.after },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                <pre className="text-xs font-mono bg-gray-50 border rounded p-2 whitespace-pre-wrap break-all">
                  {val == null ? "null" : JSON.stringify(val, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
