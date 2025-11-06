"use client"

import { useState, useEffect, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "@/lib/styles/toast-styles"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const logoutToastShown = useRef(false)
  const [callbackUrl, setCallbackUrl] = useState('/dashboard')

  // Get callback URL and check for logout param (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const callback = params.get('callbackUrl') || '/dashboard'
      setCallbackUrl(callback)
      
      // Show logout success toast if redirected from logout
      const logoutParam = params.get('logout')
      if (logoutParam === 'success' && !logoutToastShown.current) {
        logoutToastShown.current = true
        // Clear the login toast flag on logout
        localStorage.removeItem('loginToastShown')
        
        // Show toast after a small delay to ensure component is mounted
        const timer = setTimeout(() => {
          toast.success("Logged out successfully", {
            description: "You have been signed out of your account.",
          })
        }, 100)
        
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl)
    }
  }, [status, session, router, callbackUrl])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Login failed", {
          description: "Invalid email or password. Please try again.",
        })
        console.error("Login failed:", result.error)
      } else if (result?.ok) {
        // Navigate with login success parameter
        const redirectUrl = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}login=success`
        window.location.href = redirectUrl
      }
    } catch (error) {
      toast.error("Login error", {
        description: "An unexpected error occurred. Please try again.",
      })
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSSOLogin = () => {
    setIsLoading(true)
    // Add login=success parameter to callbackUrl for SSO login
    const ssoCallbackUrl = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}login=success`
    signIn("keycloak", { callbackUrl: ssoCallbackUrl })
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/echno.png"
              alt="Echno Logo"
              width={60}
              height={60}
              className="dark:invert"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-black dark:text-zinc-50">
            Welcome to Echno
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-500" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-black hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-black"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-300 dark:border-zinc-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 dark:bg-black px-2 text-zinc-500 dark:text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* SSO Login */}
          <Button
            onClick={handleSSOLogin}
            variant="outline"
            className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            Sign in with SSO
          </Button>

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <a
              href="#"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
            >
              Forgot your password?
            </a>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-zinc-900 dark:text-zinc-100 hover:underline font-medium"
              >
                Contact administrator
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}