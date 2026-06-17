"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchApplicationDetail, type ApplicationDetail } from "@/data/applications"
import { ApplicationDetailView } from "@/components/applications/application-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchApplicationDetail(id)
      if (!result) {
        setError("Application not found.")
      } else {
        setApplication(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/applications")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">Application Detail</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Loading application…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Detail view */}
      {!loading && application && (
        <ApplicationDetailView application={application} />
      )}
    </div>
  )
}
