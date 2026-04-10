"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
const router = useRouter()
const [showPassword, setShowPassword] = useState(false)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState("")
const [formData, setFormData] = useState({
username: "",
password: "",
})

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
setIsLoading(true)
setError("")


try {
  const response = await fetch("http://127.0.0.1:8000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: formData.username,
      password: formData.password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Login failed")
  }

  // 🔥 تخزين التوكن
  localStorage.setItem("token", data.access_token)

  // ممكن كمان تخزني بيانات اليوزر
  localStorage.setItem("user", JSON.stringify(data.user))

  // ✅ تحويل للشات
  router.push("/chat")

} catch (err: any) {
  setError(err.message)
} finally {
  setIsLoading(false)
}


}

return ( <div className="min-h-screen flex flex-col bg-background">
{/* Header */} <header className="flex items-center justify-between p-4 border-b border-border"> <div className="flex items-center gap-2"> <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary"> <Package className="w-5 h-5 text-primary-foreground" /> </div> <span className="font-semibold text-lg text-foreground">BrownBox</span> </div> <ThemeToggle /> </header>


  {/* Main */}
  <main className="flex-1 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-card rounded-xl border border-border p-8 shadow-lg">

        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to BrownBox Support</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Username
            </label>
            <Input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Button */}
          <Button type="submit" className="w-full h-11 mt-4" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Register */}
        <p className="text-center text-sm mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-medium">
            Register
          </Link>
        </p>

      </div>
    </div>
  </main>
</div>


)
}
