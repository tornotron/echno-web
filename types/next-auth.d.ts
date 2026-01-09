import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { UserModuleEntitlement } from './rbac/module';
import { KeycloakResourcePermission } from './keycloak';

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
      groups: string[]; // Keycloak groups (normalized, without leading slash)
      organizationId: string;
      entitlements?: UserModuleEntitlement[];
      resourcePermissions?: KeycloakResourcePermission[]; // Keycloak Authorization Services permissions
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    roles: string[];
    groups?: string[];
    organizationId?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    roles?: string[];
    groups?: string[]; // Keycloak groups (normalized)
    resourcePermissions?: KeycloakResourcePermission[]; // Keycloak Authorization Services
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
