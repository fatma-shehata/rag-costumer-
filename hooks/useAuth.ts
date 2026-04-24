"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import type { UserResponse, LoginRequest, RegisterRequest } from "@/types"

interface AuthState {
  user: UserResponse | null
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  })

  // ── Rehydrate user from localStorage on mount ──
  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        setState((prev) => ({ ...prev, user: JSON.parse(stored) }))
      } catch {
        localStorage.removeItem("user")
      }
    }
  }, [])

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }))

  // ── Login ──────────────────────────────────────
  const login = useCallback(
    async (payload: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        await authService.login(payload)
        // fetch full user object so we persist real data (id, email, etc.)
        const user = await authService.getMe()
        setState({ user, isLoading: false, error: null })
        router.push("/chat")
      } catch (err: any) {
        const msg = err.response?.data?.detail ?? err.message ?? "Login failed"
        setState((prev) => ({ ...prev, isLoading: false, error: msg }))
      }
    },
    [router]
  )

  // ── Register ───────────────────────────────────
  const register = useCallback(async (payload: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await authService.register(payload)
      setState((prev) => ({ ...prev, isLoading: false }))
      return true // caller can redirect after showing success msg
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.message ?? "Registration failed"
      setState((prev) => ({ ...prev, isLoading: false, error: msg }))
      return false
    }
  }, [])

  // ── Logout ─────────────────────────────────────
  const logout = useCallback(() => {
    authService.logout()
    setState({ user: null, isLoading: false, error: null })
    router.push("/login")
  }, [router])

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    setError,
    login,
    register,
    logout,
  }
}