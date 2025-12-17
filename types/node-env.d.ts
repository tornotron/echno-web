declare namespace NodeJS {
    export interface ProcessEnv {
      KEYCLOAK_ID: string
      KEYCLOAK_SECRET: string
      KEYCLOAK_URL: string
      KEYCLOAK_REALM: string
      KEYCLOAK_ISSUER: string
      KEYCLOAK_WELL_KNOWN: string
      NEXT_PUBLIC_API_URL: string
      NEXT_PUBLIC_KEYCLOAK_ISSUER: string
      AUTH_URL: string
      NEXTAUTH_URL: string
      NEXTAUTH_SECRET: string
    }
  }