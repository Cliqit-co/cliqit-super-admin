"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BusinessDetailView } from "@/components/businesses/business-detail"
import { fetchBusinessDetail, type BusinessDetail } from "@/data/businesses"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function BusinessDetailPage() {
  const params = useParams()
  const userId = params?.id as string

  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBusinessDetail(userId)
      if (!data) {
        setError("Business not found. The RPC may not be deployed yet, or this user has no business profile.")
      } else {
        setBusiness(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/businesses">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Businesses
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">
          {business?.businessName ?? userId}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-sm text-muted-foreground py-12 text-center">
          Loading business...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm space-y-2">
          <p className="font-medium">Failed to load business</p>
          <p className="text-red-700">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {/* Detail view — tolerate missing profile row gracefully */}
      {!loading && !error && business && (
        <BusinessDetailView business={business} onRefresh={load} />
      )}

      {/* Edge case: RPC returned null but no error thrown */}
      {!loading && !error && !business && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No business profile found for this user. The account may be an influencer
          or the profile has not been set up yet.
        </div>
      )}
    </div>
  )
}
