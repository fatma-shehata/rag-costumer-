const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

// ─── Token helpers ────────────────────────────────────────────────────────────

const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null

const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) headers["Authorization"] = `Bearer ${token}`

  // let browser set Content-Type automatically for FormData (includes boundary)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"]
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearSession()
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw Object.assign(
      new Error(errorData?.detail ?? `Request failed: ${res.status}`),
      { response: { data: errorData, status: res.status } }
    )
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
}