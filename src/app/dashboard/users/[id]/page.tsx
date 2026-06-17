"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { UserDetail } from "@/components/users/user-detail"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Button>
      </div>
      <UserDetail userId={id} />
    </div>
  )
}
