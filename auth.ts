import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { jwtDecode } from 'jwt-decode';
import { getRolePermissions } from '@/lib/rbac/permissions';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';

interface KeycloakToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  roles?: string[];
  permissions?: unknown[];
  [key: string]: unknown;
}

interface DecodedKeycloakToken {
  sid?: string;
  session_state?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  azp?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  [key: string]: unknown;
}

/**
 * Refresh Keycloak access token using refresh token
 */
async function refreshAccessToken(
  token: KeycloakToken
): Promise<KeycloakToken> {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER!;

    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_ID!,
        client_secret: process.env.KEYCLOAK_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken || '',
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) {
      throw refreshed;
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      lastRefresh: Date.now(),
    };
  } catch (error) {
    logger.error('Token refresh failed', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: 'jwt' },

  // Production cookie configuration for nginx reverse proxy
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://'),
      },
    },
  },

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      checks: ['state'],
      // Enable backchannel logout
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Track JWT callback execution (development only)
      logger.debug('JWT Callback Executed', {
        hasAccount: !!account,
        hasUser: !!user,
        provider: account?.provider || token.provider,
        timestamp: new Date().toISOString(),
      });

      // ========== KEYCLOAK LOGIN ==========
      if (account?.provider === 'keycloak') {
        token.provider = 'keycloak';
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = Date.now() + (account.expires_in ?? 300) * 1000;
        token.lastRefresh = Date.now();
        token.keycloakIssuer = process.env.KEYCLOAK_ISSUER;
        token.error = undefined;

        // NEW: Extract roles and session ID from Keycloak token
        try {
          const decodedToken = jwtDecode<DecodedKeycloakToken>(
            account.access_token!
          );

          // Log token metadata (sensitive fields auto-sanitized by logger)
          logger.debug('Keycloak Token Content', {
            sid: decodedToken?.sid,
            session_state: decodedToken?.session_state,
            sub: decodedToken?.sub,
            exp: decodedToken?.exp,
            iat: decodedToken?.iat,
            azp: decodedToken?.azp,
            hasRealmRoles: !!decodedToken?.realm_access?.roles,
            hasResourceRoles:
              !!decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]
                ?.roles,
          });

          const realmRoles = decodedToken?.realm_access?.roles || [];
          const resourceRoles =
            decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]?.roles ||
            [];

          // Combine realm and resource roles
          const keycloakRoles = [...realmRoles, ...resourceRoles];

          token.roles = keycloakRoles;

          // Compute permissions from Keycloak roles
          token.permissions = getRolePermissions(keycloakRoles);

          // Extract session ID for backchannel logout
          // Keycloak sends 'sid' in the access token
          token.sessionId =
            decodedToken?.sid || decodedToken?.session_state || token.sub;

          // Log token metadata (session ID is not logged for security)
          logger.debug('Token metadata extracted', {
            hasSessionId: !!token.sessionId,
            expiresAt: new Date(
              Date.now() + (account.expires_in ?? 300) * 1000
            ),
            expiresInSeconds: account.expires_in,
          });
        } catch (error) {
          logger.error('Failed to extract roles from Keycloak token', error);
          token.roles = [];
          token.permissions = [];
        }
      }

      // ========== USER INFO ==========
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      // Session revoked via backchannel logout
      if (token.sessionId) {
        const revoked = isSessionRevoked(token.sessionId as string);
        logger.debug('Session Revocation Check', {
          hasSessionId: true,
          isRevoked: revoked,
          timestamp: new Date().toISOString(),
        });

        if (revoked) {
          logger.auth.sessionRevoked(token.sessionId as string);
          return { ...token, error: 'SessionRevoked' };
        }
      } else {
        logger.debug('No sessionId found in token for revocation check');
      }

      // STOP refresh if already failed (check BEFORE expiration)
      if (token.error === 'RefreshAccessTokenError') {
        return token;
      }

      // Token still valid
      if (token.expiresAt && Date.now() < token.expiresAt) {
        const timeUntilExpiry = token.expiresAt - Date.now();
        logger.debug('Token still valid', {
          expiresAt: new Date(token.expiresAt),
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60_000)} minutes ${Math.floor((timeUntilExpiry % 60_000) / 1000)} seconds`,
        });
        return token;
      }

      // ========== REFRESH TOKEN ==========
      // Refresh only once
      logger.debug('Token expired, attempting refresh...');
      if (token.provider === 'keycloak' && token.refreshToken) {
        const refreshed = await refreshAccessToken(token);

        // Re-extract roles after refresh
        if (refreshed.accessToken && !refreshed.error) {
          try {
            const decodedToken = jwtDecode<DecodedKeycloakToken>(
              refreshed.accessToken
            );
            const realmRoles = decodedToken?.realm_access?.roles || [];
            const resourceRoles =
              decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]
                ?.roles || [];
            const keycloakRoles = [...realmRoles, ...resourceRoles];

            // Use Keycloak roles
            refreshed.roles = keycloakRoles;
            // Compute permissions from Keycloak roles
            refreshed.permissions = getRolePermissions(keycloakRoles);
          } catch (error) {
            logger.error('Failed to extract roles after refresh', error);
          }
        }

        return refreshed as JWT;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.email = token.email ?? '';
      session.user.name = token.name ?? '';

      // Roles (permissions and super admin status computed on-demand from roles)
      session.user.roles = token.roles || [];

      // Minimal session data to reduce cookie size
      session.provider = token.provider;
      session.expiresAt = token.expiresAt;
      session.sessionId = token.sessionId;

      if (token.error) {
        session.error = token.error;
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signOut(message) {
      // Keycloak logout
      if ('token' in message && message.token) {
        const token = message.token;

        logger.auth.logout(token.provider as string, {
          hasSessionId: !!token.sessionId,
        });

        // Logout from Keycloak if this is a Keycloak session
        if (token.provider === 'keycloak' && token.refreshToken) {
          try {
            const issuer = token.keycloakIssuer || process.env.KEYCLOAK_ISSUER;
            const logoutUrl = `${issuer}/protocol/openid-connect/logout`;

            logger.debug('Logging out from Keycloak');

            await fetch(logoutUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_ID!,
                client_secret: process.env.KEYCLOAK_SECRET!,
                refresh_token: token.refreshToken as string,
              }),
            });

            logger.debug('Keycloak logout successful');
          } catch (error) {
            logger.error('Keycloak logout error', error);
            // Don't throw - allow NextAuth logout to proceed
          }
        }
      }
    },
  },
});
