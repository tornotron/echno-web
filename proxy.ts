import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Skip auth entirely for health checks to prevent token refresh
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next()
  }

  const isLoggedIn = !!req.auth

  const isPublic =
    pathname === "/" ||
    pathname === "/login"

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/user")

  if (!isLoggedIn && isProtected) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Handle token refresh errors by forcing re-authentication
  if (req.auth?.error === "RefreshAccessTokenError") {
    const url = new URL("/login", req.url)
    url.searchParams.set("error", "SessionExpired")
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
