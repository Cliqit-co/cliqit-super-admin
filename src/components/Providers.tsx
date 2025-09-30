"use client"

import { ReactNode } from "react"
import { NhostNextProvider } from "@nhost/nextjs"
import { nhost } from "@/lib/nhost"

export function Providers({ children }: { children: ReactNode }) {
  return <NhostNextProvider nhost={nhost} initial={null}>{children}</NhostNextProvider>
}


