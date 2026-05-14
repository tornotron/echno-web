import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';
import { TOKEN_REFRESH } from '@/lib/auth/constants';
import type { KeycloakToken } from '@/types/keycloak';

/**
 * Lightweight base64 decode helper to extract session ID from JWT
 * without pulling in the full jwtDecode library.
 */
function extractSessionIdFromJwt(
  token: string
): { sid?: string; session_state?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );
    return { sid: decoded.sid, session_state: decoded.session_state };
  } catch {
    return null;
  }
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
      expiresAt: refreshed.expires_at
        ? refreshed.expires_at * 1000
        : Date.now() + refreshed.expires_in * 1000,
      sessionExpiresAt: refreshed.refresh_expires_in
        ? Date.now() + refreshed.refresh_expires_in * 1000
        : token.sessionExpiresAt,
      lastRefresh: Date.now(),
      error: undefined,
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
    // Mock credentials provider — DEVELOPMENT ONLY.
    // Credentials are read from DEV_MOCK_EMAIL / DEV_MOCK_PASSWORD so they are
    // not committed to the repo. If either is missing the provider fails
    // closed (returns null) instead of falling back to a hard-coded default.
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [
          Credentials({
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              const devEmail = process.env.DEV_MOCK_EMAIL;
              const devPassword = process.env.DEV_MOCK_PASSWORD;
              if (!devEmail || !devPassword) {
                logger.warn(
                  'Credentials provider enabled but DEV_MOCK_EMAIL/DEV_MOCK_PASSWORD not set; rejecting login'
                );
                return null;
              }
              if (
                credentials?.email === devEmail &&
                credentials?.password === devPassword
              ) {
                return {
                  id: 'mock-user-id',
                  name: 'Mock Admin',
                  email: devEmail,
                };
              }
              return null;
            },
          }),
        ]),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      logger.debug('JWT Callback Executed', {
        hasAccount: !!account,
        hasUser: !!user,
        provider: account?.provider || token.provider,
        timestamp: new Date().toISOString(),
      });

      // ========== CREDENTIALS LOGIN ==========
      if (account?.provider === 'credentials') {
        token.provider = 'credentials';
      }

      // ========== KEYCLOAK LOGIN ==========
      if (account?.provider === 'keycloak') {
        token.provider = 'keycloak';
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + (account.expires_in ?? 300) * 1000;
        token.sessionExpiresAt =
          Date.now() + ((account.refresh_expires_in as number) ?? 1800) * 1000;
        token.lastRefresh = Date.now();
        token.keycloakIssuer = process.env.KEYCLOAK_ISSUER;
        token.error = undefined;

        // Extract session ID for frontchannel logout (lightweight, no jwtDecode)
        if (account.access_token) {
          const decoded = extractSessionIdFromJwt(account.access_token);
          token.sessionId = decoded?.sid || decoded?.session_state || token.sub;

          logger.debug('Token metadata extracted', {
            hasSessionId: !!token.sessionId,
            accessTokenExpiresInSeconds: account.expires_in,
            sessionExpiresInSeconds: account.refresh_expires_in,
          });

          // Fetch user profile to get the real defaultOrganizationId.
          // Bounded by a short timeout: a slow backend must not stall login.
          // On timeout/failure we proceed without it — the field can be
          // hydrated later on the first authenticated page render.
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            TOKEN_REFRESH.USER_PROFILE_FETCH_TIMEOUT_MS
          );
          try {
            const backendUrl = process.env.BACKEND_API_URL;
            const res = await fetch(`${backendUrl}/user/web`, {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            });
            if (res.ok) {
              const userData = await res.json();
              token.defaultOrganizationId =
                userData.defaultOrganizationId?.toString();
              logger.debug('Fetched defaultOrganizationId on login', {
                defaultOrganizationId: token.defaultOrganizationId,
              });
            } else {
              logger.warn('Failed to fetch user profile on login', {
                status: res.status,
              });
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              logger.warn(
                'User profile fetch timed out during login; continuing without defaultOrganizationId',
                {
                  timeoutMs: TOKEN_REFRESH.USER_PROFILE_FETCH_TIMEOUT_MS,
                }
              );
            } else {
              logger.error('Error fetching user profile on login', error);
            }
          } finally {
            clearTimeout(timeoutId);
          }
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
      logger.debug('Token expiring soon, attempting refresh...');
      if (token.provider === 'keycloak' && token.refreshToken) {
        const refreshed = await refreshAccessToken(token);

        // If refresh failed, invalidate session immediately
        if (refreshed.error) {
          logger.error('Token refresh failed, invalidating session', {
            error: refreshed.error,
          });
          return null;
        }

        return refreshed as JWT;
      }

      // No refresh token available, invalidate session
      if (token.provider === 'keycloak') {
        logger.warn('No refresh token available, invalidating session');
        return null;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.email = token.email ?? '';
      session.user.name = token.name ?? '';

      session.user.defaultOrganizationId =
        (token.defaultOrganizationId as string) ?? '';

      // Client-visible session data. Do NOT expose tokens here — anything
      // placed on the session object is returned in plaintext to the browser
      // via /api/auth/session. Server-side code that needs the access/id/
      // refresh token must read the encrypted JWT directly (see
      // lib/auth/get-session-tokens.ts).
      session.provider = token.provider;
      session.expiresAt = token.expiresAt;
      session.sessionExpiresAt = token.sessionExpiresAt as number | undefined;
      session.sessionId = token.sessionId;

      if (token.error) {
        session.error = token.error;
      }

      return session;
    },

    // Role-based redirect after sign-in
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      logger.debug(
        'Redirect callback - sending to home for role-based redirect'
      );
      return baseUrl;
    },

    // Handle sign-in authorization
    async signIn({ user, account }) {
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
    signIn: '/',
    error: '/',
  },

  events: {
    async signOut(message) {
      if ('token' in message && message.token) {
        const token = message.token;

        logger.auth.logout(token.provider as string, {
          hasSessionId: !!token.sessionId,
        });

        if (token.provider === 'keycloak' && token.idToken) {
          try {
            const issuer = token.keycloakIssuer || process.env.KEYCLOAK_ISSUER;
            const logoutUrl = new URL(
              `${issuer}/protocol/openid-connect/logout`
            );

            logoutUrl.searchParams.set(
              'id_token_hint',
              token.idToken as string
            );
            logoutUrl.searchParams.set('client_id', process.env.KEYCLOAK_ID!);

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
          }
        }
      }
    },
  },
});
