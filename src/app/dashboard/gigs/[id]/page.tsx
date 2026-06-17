"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchGigDetail } from "@/data/gigs"
import { GigDetailView } from "@/components/gigs/gig-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { GigDetail } from "@/data/gigs"

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gig, setGig] = React.useState<GigDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchGigDetail(id)
      if (!data) {
        setNotFound(true)
      } else {
        setGig(data)
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/dashboard/gigs")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Gigs
      </Button>

      {loading && (
        <div className="text-sm text-gray-500 py-12 text-center">Loading gig...</div>
      )}

      {!loading && notFound && (
        <div className="text-sm text-gray-500 py-12 text-center">
          Gig not found.
        </div>
      )}

      {!loading && gig && (
        <GigDetailView gig={gig} onRefresh={load} />
      )}
    </div>
  )
}
