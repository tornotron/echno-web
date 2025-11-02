import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    provider?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    accessToken?: string
    idToken?: string
    refreshToken?: string
    provider?: string
  }
}
