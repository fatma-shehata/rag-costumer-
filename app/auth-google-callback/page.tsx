"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/services/auth.service"

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token") ?? searchParams.get("access_token")

    if (token) {
      // save token then fetch real user info
      localStorage.setItem("token", token)
      authService.getMe()
        .then(() => router.replace("/chat"))
        .catch(() => router.replace("/login?error=google_failed"))
    } else {
      // maybe backend redirects here after handling callback itself
      // try to fetch user with existing token
      const existing = localStorage.getItem("token")
      if (existing) {
        authService.getMe()
          .then(() => router.replace("/chat"))
          .catch(() => router.replace("/login?error=google_failed"))
      } else {
        router.replace("/login?error=google_failed")
      }
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Signing you in with Google...</p>
      </div>
    </div>
  )
}