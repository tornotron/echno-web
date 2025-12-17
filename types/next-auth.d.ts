import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    provider?: string

    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string
    role?: string
    accessToken?: string
    idToken?: string
    refreshToken?: string
    provider?: string
  }
}
