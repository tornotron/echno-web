import NextAuth, { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: "", // Not required for PKCE
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock user for testing - in production, validate against your backend
        console.log("Credentials received:", credentials)

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        if (credentials.email === "admin@echno.local" && credentials.password === "password@123") {
          console.log("Login successful for admin user")
          return {
            id: "1",
            email: credentials.email,
            name: "Admin User",
            role: "admin",
          }
        }

        console.log("Login failed - invalid credentials")
        return null
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
