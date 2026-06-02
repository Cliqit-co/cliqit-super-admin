// Server-side Supabase client. Use in Route Handlers / Server Actions.
// Uses anon key with the user's cookie session.

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        for (const c of toSet) {
          try {
            cookieStore.set(c.name, c.value, c.options)
          } catch {
            // Read-only context (RSC). Safe to ignore.
          }
        }
      },
    },
  })
}

// Service-role client for privileged operations (notification sending etc.).
// NEVER expose this to the browser.
export function getServiceSupabase(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY env var missing")
  // Lazy import to avoid pulling node-only paths into edge bundles unnecessarily.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js")
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
