import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["pkce", "state"], 
      client: {
        token_endpoint_auth_method: "none",
      },
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
      if (account?.provider === "keycloak") {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.provider = "keycloak"
      }

      if (account?.provider === "credentials" && user) {
        token.accessToken = user.accessToken
        token.provider = "credentials"
      }

      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
      }

      return token
    },

    async session({ session, token }) {
    session.accessToken = token.accessToken
    session.provider = token.provider

    if (session.user && token.userId) {
      session.user.id = token.userId
      session.user.email = token.email ?? ""
      session.user.name = token.name ?? ""
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
