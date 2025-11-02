declare namespace NodeJS {
    export interface ProcessEnv {
      KEYCLOAK_PUBLIC_CLIENT_ID: string
      KEYCLOAK_CLIENT_SECRET: string
      KEYCLOAK_URL: string
      KEYCLOAK_REALM: string
      KEYCLOAK_ISSUER: string
      KEYCLOAK_WELL_KNOWN: string
      NEXT_PUBLIC_API_URL: string
      NEXT_PUBLIC_KEYCLOAK_ISSUER: string
    }
  }