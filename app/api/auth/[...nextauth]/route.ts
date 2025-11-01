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
        // This is a placeholder - in a real app, you'd validate against your backend
        if (credentials?.email === "admin@echno.com" && credentials?.password === "password") {
          return {
            id: "1",
            email: credentials.email,
            name: "Admin User",
          }
        }
        return null
      }
    }),
  ],
  session: {
    strategy: "jwt",
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
