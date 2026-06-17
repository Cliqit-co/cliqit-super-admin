"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  className?: string
  children: ReactNode
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full min-h-[200px] animate-pulse flex-col gap-3 pt-2">
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="flex-1 rounded bg-gray-100" />
    </div>
  )
}

function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-gray-400">
      <svg
        className="h-10 w-10 opacity-40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  )
}

export function ChartCard({
  title,
  description,
  loading = false,
  empty = false,
  emptyMessage,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <LoadingSkeleton />
        ) : empty ? (
          <EmptyState message={emptyMessage} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
