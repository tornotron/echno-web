import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { jwtDecode } from 'jwt-decode';
import { normalizeGroups } from '@/lib/rbac/role-groups';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';
import { TOKEN_REFRESH } from '@/lib/auth/constants';
import type { DecodedKeycloakToken, KeycloakToken } from '@/types/keycloak';
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
      // Use expires_at if available, otherwise calculate from expires_in
      expiresAt: refreshed.expires_at
        ? refreshed.expires_at * 1000
        : Date.now() + refreshed.expires_in * 1000,
      // Update sessionExpiresAt when refresh token is used
      // Keycloak extends the SSO session when refresh token is used
      sessionExpiresAt: refreshed.refresh_expires_in
        ? Date.now() + refreshed.refresh_expires_in * 1000
        : token.sessionExpiresAt,
      lastRefresh: Date.now(),
      error: undefined, // Clear any previous errors
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
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: 'openid email profile',
          code_challenge_method: 'S256',
        },
      },
      checks: ['pkce', 'state'],
      // Public client configuration
      client: {
        token_endpoint_auth_method: 'none',
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
        // Use expires_at from NextAuth if available, otherwise calculate
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + (account.expires_in ?? 300) * 1000;
        // Track when the Keycloak session (refresh token) expires
        // refresh_expires_in is the SSO session timeout (typically 30 minutes)
        token.sessionExpiresAt =
          Date.now() + ((account.refresh_expires_in as number) ?? 1800) * 1000;
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

          // Extract and normalize groups from Keycloak token
          // Groups come as paths like "/management", "/engineering/frontend"
          const rawGroups = decodedToken?.groups || [];
          token.groups = normalizeGroups(rawGroups);

          // Extract resource permissions from Keycloak Authorization Services
          // These are fine-grained permissions with resource:scope format
          token.resourcePermissions =
            decodedToken?.authorization?.permissions || [];

          // Log extracted roles, groups, and permissions for debugging
          logger.debug('Roles and groups extracted from Keycloak token', {
            realmRoles,
            resourceRoles,
            combinedRoles: keycloakRoles,
            groups: token.groups,
            resourcePermissions: token.resourcePermissions?.map((p) => ({
              resource: p.rsname,
              scopes: p.scopes,
            })),
          });

          // Extract session ID for frontchannel logout
          // Keycloak sends 'sid' in the access token
          token.sessionId =
            decodedToken?.sid || decodedToken?.session_state || token.sub;

          // Log token metadata (session ID is not logged for security)
          logger.debug('Token metadata extracted', {
            hasSessionId: !!token.sessionId,
            accessTokenExpiresAt: new Date(
              Date.now() + (account.expires_in ?? 300) * 1000
            ),
            accessTokenExpiresInSeconds: account.expires_in,
            sessionExpiresAt: token.sessionExpiresAt
              ? new Date(token.sessionExpiresAt)
              : undefined,
            sessionExpiresInSeconds: account.refresh_expires_in,
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

      // Session revoked via frontchannel logout
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

      // Check if Keycloak session has expired (refresh token expiry)
      if (
        token.sessionExpiresAt &&
        Date.now() > (token.sessionExpiresAt as number)
      ) {
        logger.warn('Keycloak session expired, invalidating session', {
          sessionExpiresAt: new Date(token.sessionExpiresAt as number),
        });
        return null; // Invalidate session immediately
      }

      // Token still valid (with buffer to prevent race conditions)
      if (
        token.expiresAt &&
        Date.now() <
          (token.expiresAt as number) - TOKEN_REFRESH.REFRESH_BUFFER_MS
      ) {
        const timeUntilExpiry = (token.expiresAt as number) - Date.now();
        logger.debug('Token still valid', {
          expiresAt: new Date(token.expiresAt as number),
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60_000)} minutes ${Math.floor((timeUntilExpiry % 60_000) / 1000)} seconds`,
          refreshBuffer: `${TOKEN_REFRESH.REFRESH_BUFFER_MS / 1000} seconds`,
        });
        return token;
      }

      // ========== REFRESH TOKEN ==========
      // Refresh only once
      logger.debug('Token expiring soon, attempting refresh...');
      if (token.provider === 'keycloak' && token.refreshToken) {
        const refreshed = await refreshAccessToken(token);

        // If refresh failed, invalidate session immediately
        if (refreshed.error) {
          logger.error('Token refresh failed, invalidating session', {
            error: refreshed.error,
          });
          return null; // Invalidate session immediately
        }

        // Re-extract roles, groups, and permissions after refresh
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

            // Re-extract groups after refresh
            const rawGroups = decodedToken?.groups || [];
            refreshed.groups = normalizeGroups(rawGroups);

            // Re-extract resource permissions after refresh
            refreshed.resourcePermissions =
              decodedToken?.authorization?.permissions || [];
          } catch (error) {
            logger.error(
              'Failed to extract roles/groups/permissions after refresh',
              error
            );
          }
        }

        return refreshed as JWT;
      }

      // No refresh token available, invalidate session
      logger.warn('No refresh token available, invalidating session');
      return null;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.email = token.email ?? '';
      session.user.name = token.name ?? '';

      // Roles (permissions and system admin status computed on-demand from roles)
      session.user.roles = token.roles || [];

      // Groups from Keycloak (normalized)
      session.user.groups = token.groups || [];

      // Resource permissions from Keycloak Authorization Services
      session.user.resourcePermissions = token.resourcePermissions || [];

      // Log session data for debugging
      logger.debug('Session callback - user data', {
        userId: token.userId,
        email: token.email,
        roles: session.user.roles,
        groups: session.user.groups,
        resourcePermissionsCount: session.user.resourcePermissions?.length || 0,
      });

      // DEVELOPMENT: Set organizationId for testing
      // In production, this would come from the user's profile in your database
      // For now, map based on user email or default to '1'
      const email = token.email as string;
      if (email?.includes('org2')) {
        session.user.organizationId = '2'; // Limited access
      } else if (email?.includes('org3')) {
        session.user.organizationId = '3'; // Minimal access
      } else {
        session.user.organizationId = '1'; // Full access (default)
      }

      // Minimal session data to reduce cookie size
      session.provider = token.provider;
      session.expiresAt = token.expiresAt;
      session.sessionExpiresAt = token.sessionExpiresAt as number | undefined; // When Keycloak session expires
      session.sessionId = token.sessionId;
      session.accessToken = token.accessToken as string; // Include access token for backend API calls

      if (token.error) {
        session.error = token.error;
      }

      return session;
    },

    // Role-based redirect after sign-in
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Redirect to /login - middleware will handle role-based redirect
      // This allows the middleware to check roles and redirect appropriately
      logger.debug(
        'Redirect callback - sending to /login for role-based redirect'
      );
      return `${baseUrl}/login`;
    },

    // Handle sign-in authorization
    async signIn({ user, account }) {
      // Allow all sign-ins from Keycloak
      if (account?.provider === 'keycloak') {
        logger.auth.login('keycloak', {
          userId: user.id,
          email: user.email,
        });
        return true;
      }

      return true;
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
        // Use standard OIDC logout flow with id_token_hint
        if (token.provider === 'keycloak' && token.idToken) {
          try {
            const issuer = token.keycloakIssuer || process.env.KEYCLOAK_ISSUER;
            const logoutUrl = new URL(
              `${issuer}/protocol/openid-connect/logout`
            );

            // Standard OIDC logout parameters
            logoutUrl.searchParams.set(
              'id_token_hint',
              token.idToken as string
            );
            logoutUrl.searchParams.set('client_id', process.env.KEYCLOAK_ID!);

            // Optional: Add post_logout_redirect_uri if needed
            // logoutUrl.searchParams.set('post_logout_redirect_uri', `${process.env.NEXTAUTH_URL}/login`);

            logger.debug('Logging out from Keycloak', {
              hasIdToken: !!token.idToken,
            });

            const response = await fetch(logoutUrl, { method: 'GET' });

            if (response.ok) {
              logger.debug('Keycloak session terminated successfully');
            } else {
              logger.error('Keycloak logout failed', {
                status: response.status,
                statusText: response.statusText,
              });
            }
          } catch (error) {
            logger.error('Keycloak logout error', error);
            // Don't throw - allow NextAuth logout to proceed
          }
        }
      }
    },
  },
});
