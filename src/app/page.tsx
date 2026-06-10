import { redirect } from "next/navigation"

// Internal tool — no public landing. RequireAuth on /dashboard bounces
// unauthenticated users to /sign-in.
export default function Home() {
  redirect("/dashboard")
}
