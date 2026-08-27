import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    provider?: string;
    error?: string;
    expiresAt?: number;
    sessionExpiresAt?: number;
    sessionId?: string;
    user: {
      id: string;
      defaultOrganizationId: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    defaultOrganizationId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    defaultOrganizationId?: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    provider?: string;
    keycloakIssuer?: string;
    expiresAt?: number;
    sessionExpiresAt?: number;
    lastRefresh?: number;
    /**
     * When the server last saw the client assert that a user was present.
     * The idle deadline is measured from here rather than from browser
     * storage, which is why it lives on the encrypted token.
     */
    lastActivityAt?: number;
    error?: string;
    sessionId?: string;
  }
}
