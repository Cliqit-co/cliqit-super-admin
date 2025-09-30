"use client"

import { ReactNode, useEffect } from "react"
import { useAuthenticationStatus } from "@nhost/nextjs"
import { useRouter, usePathname } from "next/navigation"

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuthenticationStatus()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectParam = pathname ? `?redirectTo=${encodeURIComponent(pathname)}` : ""
      router.replace(`/sign-in${redirectParam}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}


