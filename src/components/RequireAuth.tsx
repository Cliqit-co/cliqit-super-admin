"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<"loading" | "authed" | "unauthed">("loading")

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        setStatus("unauthed")
        const redirectParam = pathname ? `?redirectTo=${encodeURIComponent(pathname)}` : ""
        router.replace(`/sign-in${redirectParam}`)
        return
      }

      // Gate to superAdmin role on every protected page (defense in depth).
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
      if (cancelled) return

      if (!profile || profile.role !== "superAdmin") {
        await supabase.auth.signOut()
        setStatus("unauthed")
        router.replace("/sign-in")
        return
      }

      setStatus("authed")
    }
    check()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus("unauthed")
        router.replace("/sign-in")
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [router, pathname])

  if (status !== "authed") return null
  return <>{children}</>
}
