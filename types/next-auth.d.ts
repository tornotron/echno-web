import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { Permission } from './rbac';
import { UserModuleEntitlement } from './rbac/module';

declare module 'next-auth' {
  interface Session {
    provider?: string;
    error?: string;
    expiresAt?: number;
    sessionExpiresAt?: number; // When Keycloak session (refresh token) expires
    sessionId?: string;
    accessToken?: string;
    user: {
      id: string;
      roles: string[];
      organizationId: string;
      entitlements?: UserModuleEntitlement[];
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    // NEW: Multiple roles support
    roles: string[];
    organizationId?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    roles?: string[];
    permissions?: Permission[];
    organizationId?: string;
    entitlements?: UserModuleEntitlement[];
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    provider?: string;
    keycloakIssuer?: string;
    expiresAt?: number;
    sessionExpiresAt?: number; // When Keycloak session (refresh token) expires
    lastRefresh?: number;
    error?: string;
    sessionId?: string;
  }
}
