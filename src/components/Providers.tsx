"use client"

// Supabase client doesn't need a React Context Provider — the hook works directly off the singleton.
// We keep this component as a pass-through so existing imports keep working and future providers
// (theme, toaster) have a single mount point.

import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>
}
