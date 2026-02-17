import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    provider?: string;
    error?: string;
    expiresAt?: number;
    sessionExpiresAt?: number;
    sessionId?: string;
    accessToken?: string;
    user: {
      id: string;
      organizationId: string;
      defaultOrganizationId: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    organizationId?: string;
    defaultOrganizationId?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    organizationId?: string;
    defaultOrganizationId?: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    provider?: string;
    keycloakIssuer?: string;
    expiresAt?: number;
    sessionExpiresAt?: number;
    lastRefresh?: number;
    error?: string;
    sessionId?: string;
  }
}
