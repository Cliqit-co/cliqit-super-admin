"use client"

import { Suspense, useState, FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }
      if (!data.user) {
        setError("Sign-in failed")
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
      if (profileErr || !profile || profile.role !== "superAdmin") {
        await supabase.auth.signOut()
        setError("This account is not a super admin.")
        setIsLoading(false)
        return
      }

      const redirectTo = params.get("redirectTo") || "/dashboard"
      router.replace(redirectTo)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Use your admin credentials</p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}
