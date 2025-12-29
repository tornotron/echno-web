import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { Permission } from './rbac';

declare module 'next-auth' {
  interface Session {
    provider?: string;
    error?: string;
    expiresAt?: number;
    sessionId?: string;
    user: {
      id: string;
      roles: string[];
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    // NEW: Multiple roles support
    roles: string[];
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    roles?: string[];
    permissions?: Permission[];
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    provider?: string;
    keycloakIssuer?: string;
    expiresAt?: number;
    lastRefresh?: number;
    error?: string;
    sessionId?: string;
  }
}
