import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const isPublicRoute = 
    pathname === "/login" || 
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health")

  // Protected routes that require authentication
  const isProtectedRoute = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/user")

  // If user is not logged in and trying to access protected route, redirect to login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and trying to access login page, redirect to dashboard
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Check for token refresh errors and redirect to login
  if (isLoggedIn && req.auth?.error === "RefreshAccessTokenError") {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("error", "SessionExpired")
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

// Configure which routes use the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
