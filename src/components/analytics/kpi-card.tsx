"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatNumber } from "@/lib/utils"

interface KpiCardProps {
  icon: LucideIcon
  value: number
  label: string
  trend?: {
    value: number
    direction: "up" | "down" | "flat"
  }
  className?: string
}

export function KpiCard({ icon: Icon, value, label, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-bold text-gray-900">{formatNumber(value)}</span>
            <span className="text-sm text-gray-500">{label}</span>
          </div>
          <div className="rounded-lg bg-purple-50 p-2">
            <Icon className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "font-medium",
                trend.direction === "up" && "text-green-600",
                trend.direction === "down" && "text-red-500",
                trend.direction === "flat" && "text-gray-400",
              )}
            >
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.direction === "flat" && "→"}
              {" "}{Math.abs(trend.value)}%
            </span>
            <span className="text-gray-400">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
