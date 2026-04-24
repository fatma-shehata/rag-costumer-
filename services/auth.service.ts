import { apiClient } from "@/lib/api-client"
import type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  UserResponse,
  ForgotPasswordRequest,
  OTPResponse,
  VerifyOTPRequest,
  ResetTokenResponse,
  ResetPasswordRequest,
} from "@/types"

export const authService = {
  /**
   * POST /auth/register
   * Create a new user account.
   */
  register: async (payload: RegisterRequest): Promise<UserResponse> => {
    const { data } = await apiClient.post<UserResponse>("/auth/register", payload)
    return data
  },

  /**
   * POST /auth/login
   * Returns an access token; persists token + user in localStorage.
   */
  login: async (payload: LoginRequest): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>("/auth/login", payload)
    localStorage.setItem("token", data.access_token)
    return data
  },

  /**
   * GET /auth/me
   * Returns the currently authenticated user; persists user in localStorage.
   */
  getMe: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>("/auth/me")
    localStorage.setItem("user", JSON.stringify(data))
    return data
  },

  /**
   * POST /auth/forgot-password
   * Sends an OTP to the user's email.
   */
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<OTPResponse> => {
    const { data } = await apiClient.post<OTPResponse>("/auth/forgot-password", payload)
    return data
  },

  /**
   * POST /auth/verify-otp
   * Verifies the OTP and returns a reset token.
   */
  verifyOtp: async (payload: VerifyOTPRequest): Promise<ResetTokenResponse> => {
    const { data } = await apiClient.post<ResetTokenResponse>("/auth/verify-otp", payload)
    return data
  },

  /**
   * POST /auth/reset-password
   * Resets the user's password using the reset token.
   */
  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    await apiClient.post("/auth/reset-password", payload)
  },

  /**
   * GET /auth/google/login
   * Redirects the browser to the Google OAuth consent screen.
   */
  googleLogin: (): void => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
    window.location.href = `${base}/auth/google/login`
  },

  /**
   * Clears the session from localStorage (client-side logout).
   */
  logout: (): void => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
}