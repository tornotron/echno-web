import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import Credentials from "next-auth/providers/credentials"

/**
 * Refresh Keycloak access token using refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER!

    const response = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_PUBLIC_CLIENT_ID!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
      }
    )

    const refreshed = await response.json()

    if (!response.ok) {
      throw refreshed
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    }
  } catch (err) {
    console.error("Token refresh failed:", err)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === "development",

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  // Production cookie configuration for nginx reverse proxy
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://"),
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https://"),
      },
    },
  },

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_PUBLIC_CLIENT_ID!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["pkce", "state"],
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is not configured")
          return null
        }

        try {
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          })

          if (!res.ok) {
            console.error(`Login failed: ${res.status} ${res.statusText}`)
            return null
          }

          const data = await res.json()

          if (!data?.user || !data?.access_token) {
            console.error("Invalid response from auth API")
            return null
          }

          return {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            accessToken: data.access_token,
          }
        } catch (error) {
          console.error("Auth API error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {

      if (account?.provider === "keycloak") {
        token.provider = "keycloak"
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.expiresAt = Date.now() + (account.expires_in ?? 300) * 1000
      }

      if (account?.provider === "credentials" && user) {
        token.provider = "credentials"
        token.accessToken = user.accessToken
        token.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
      }

      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
      }

      if (token.expiresAt && Date.now() < token.expiresAt) {
        return token
      }

      if (token.provider === "keycloak" && token.refreshToken) {
        return refreshAccessToken(token)
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.email = token.email ?? ""
      session.user.name = token.name ?? ""
      session.user.role = token.role

      session.accessToken = token.accessToken
      session.provider = token.provider

      if (token.error) {
        session.error = token.error
      }

      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
})
