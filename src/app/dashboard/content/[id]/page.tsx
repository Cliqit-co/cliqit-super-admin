"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { fetchSubmissionDetail, ContentSubmissionDetail } from "@/data/content-submissions"
import { SubmissionDetail } from "@/components/content/submission-detail"
import { Button } from "@/components/ui/button"

export default function ContentSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [submission, setSubmission] = React.useState<ContentSubmissionDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchSubmissionDetail(id)
      if (!data) {
        setNotFound(true)
      } else {
        setSubmission(data)
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading submission...</div>
    )
  }

  if (notFound || !submission) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">Submission not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/content"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Content Submissions
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Submission Detail</h1>

      <SubmissionDetail
        submission={submission}
        onUpdate={load}
      />
    </div>
  )
}
