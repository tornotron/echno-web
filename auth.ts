import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import Credentials from "next-auth/providers/credentials"

/**
 * Refreshes the Keycloak access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const issuerUrl = process.env.KEYCLOAK_ISSUER!
    const response = await fetch(`${issuerUrl}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_PUBLIC_CLIENT_ID!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + (refreshedTokens.expires_in ?? 300) * 1000,
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_PUBLIC_CLIENT_ID!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["pkce", "state", "nonce"], 
      client: {
        token_endpoint_auth_method: "none",
      },
      allowDangerousEmailAccountLinking: false,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

        const res = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })

        if (!res.ok) return null

        const data = await res.json()

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          accessToken: data.access_token,
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account?.provider === "keycloak") {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.provider = "keycloak"
        // Set expiration time (default 300 seconds if not provided)
        token.expiresAt = Date.now() + (account.expires_in ?? 300) * 1000
      }

      if (account?.provider === "credentials" && user) {
        token.accessToken = user.accessToken
        token.provider = "credentials"
        // Credentials tokens typically last longer, set 30 days
        token.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
      }

      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number)) {
        return token
      }

      // Access token has expired, try to refresh it (only for Keycloak)
      if (token.provider === "keycloak" && token.refreshToken) {
        return await refreshAccessToken(token)
      }

      return token
    },

    async session({ session, token }) {
      // Pass all tokens to the session
      session.accessToken = token.accessToken
      session.idToken = token.idToken
      session.refreshToken = token.refreshToken
      session.provider = token.provider

      if (session.user && token.userId) {
        session.user.id = token.userId
        session.user.email = token.email ?? ""
        session.user.name = token.name ?? ""
      }

      // Indicate if there was an error refreshing the token
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

  debug: process.env.NODE_ENV === "development",
})
