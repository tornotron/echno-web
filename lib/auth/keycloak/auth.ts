import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';
import { TOKEN_REFRESH } from '@/lib/auth/constants';
import {
  RefreshRejectedError,
  createAccessTokenRefresher,
} from '@/lib/auth/refresh-access-token';
import {
  isActivityAssertion,
  isIdlePastDeadline,
  recordSessionActivity,
} from '@/lib/auth/session-idle';

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
 * Refreshes the access token, once per refresh token, retrying only what is
 * worth retrying. See `lib/auth/refresh-access-token.ts` for why those two
 * properties matter more than they look.
 *
 * Built lazily: the environment is read at call time, not at module load, so
 * importing `auth.ts` never depends on the Keycloak variables being present.
 */
let refreshAccessToken: ReturnType<typeof createAccessTokenRefresher> | null =
  null;

function getAccessTokenRefresher() {
  refreshAccessToken ??= createAccessTokenRefresher({
    fetch: (...args) => globalThis.fetch(...args),
    issuer: process.env.KEYCLOAK_ISSUER!,
    clientId: process.env.KEYCLOAK_ID!,
  });
  return refreshAccessToken;
}

/**
 * The NextAuth configuration, named so the callbacks can be driven directly.
 *
 * Split out from the {@link NextAuth} call below purely so a test can reach
 * {@code callbacks.jwt}. The idle deadline lives inside that callback and is an
 * ordering rule, so the only test that can hold it is one that calls the real
 * function; a test that reimplemented the sequence would agree with itself
 * whatever the callback did. Nothing else about the configuration changes.
 */
export const authConfig = {
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: 'jwt' },

  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),

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
    async jwt({ token, user, account, trigger, session }) {
      logger.debug('JWT Callback Executed', {
        hasAccount: !!account,
        hasUser: !!user,
        provider: account?.provider || token.provider,
        timestamp: new Date().toISOString(),
      });

      // ========== CREDENTIALS LOGIN ==========
      // No activity clock is started here. The session lifecycle hook runs only
      // for Keycloak sessions, so nothing would ever advance a clock on this
      // one, and a deadline nothing can renew is just a timer that signs the
      // developer out mid-keystroke. The field stays absent and the checks
      // below leave it alone.
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
        // Signing in is the most unambiguous activity there is, so the idle
        // clock starts here rather than waiting for the first update.
        recordSessionActivity(token, Date.now());

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

      // ========== ACTIVITY ==========
      // The verdict is taken first, on the timestamp the token arrived with,
      // and everything below reads this rather than asking again.
      //
      // The order matters and it is the whole point. Recording activity before
      // asking the question overwrites the only evidence the question is about,
      // so the deadline could never be reached on the one path that renews a
      // session. Whoever holds the cookie would decide when the session ends,
      // which is exactly the arrangement moving the deadline onto the signed
      // token was meant to end.
      const now = Date.now();
      const idlePastDeadline = isIdlePastDeadline(token.lastActivityAt, now);

      // A session update carrying the activity assertion is the client saying
      // somebody is at the keyboard. The timestamp is taken here, from this
      // process's clock, and never read off the payload: a time supplied by the
      // caller would be exactly as unverifiable as the browser storage this
      // replaces. A plain `update()` refreshes the access token and is
      // deliberately not treated as activity, or a tab left running would hold
      // its own session open forever.
      //
      // A session already past its deadline is not renewed by an assertion.
      // Nothing is recorded onto a token that is about to be marked ended, so
      // the timestamp the session died on stays readable.
      if (
        !idlePastDeadline &&
        trigger === 'update' &&
        isActivityAssertion(session)
      ) {
        recordSessionActivity(token, now);
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

      // Idle past the deadline. This is the enforcement that matters, because
      // `jwt()` is the only path that mints a fresh access token: once it stops
      // refreshing, the bearer in the cookie dies within its own few minutes
      // and Keycloak stops having its idle timer reset, so the session ends on
      // every clock rather than only on the one the browser keeps.
      //
      // The verdict was taken above, before the activity assertion could touch
      // the timestamp. It deliberately carries no tolerance, and the case that
      // once argued for one is covered elsewhere: a client whose push fails
      // retries on the next evaluation tick, because `isActivitySyncDue` reads
      // a `lastSyncedAt` that only advances on success. Reaching the deadline
      // therefore takes roughly fifty consecutive failures, by which point the
      // same round trip has stopped refreshing the access token and the session
      // is ending on expiry regardless. Refusing an update is not what ends a
      // working session; a broken update path is.
      if (idlePastDeadline) {
        logger.warn('Session idle past its deadline, ending session', {
          hasSessionId: !!token.sessionId,
        });
        return { ...token, error: 'SessionIdleTimeout' };
      }

      // There is deliberately no separate check on `sessionExpiresAt` here.
      // The session now ends on inactivity, which the client tracks and acts
      // on, and a refresh token that really has expired is refused by the
      // exchange below and reported the same way as any other dead session.
      // One path to "the session is over" is easier to reason about than two,
      // and the old check invalidated the token outright, which left the
      // browser holding a session that had silently ceased to exist.

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
      //
      // Nothing below returns null, and that is the point. Returning null drops
      // the session cookie, so the browser arrives at `status: 'unauthenticated'`
      // carrying no error at all: no toast, no redirect, nothing for the app to
      // react to. The user is left on a working-looking page where every request
      // quietly fails. Marking the token instead keeps the session addressable
      // long enough to say what happened, which the middleware and the session
      // monitor both already know how to do.
      logger.debug('Token expiring soon, attempting refresh...');
      if (token.provider === 'keycloak' && token.refreshToken) {
        try {
          return (await getAccessTokenRefresher()(token)) as JWT;
        } catch (error) {
          if (error instanceof RefreshRejectedError) {
            logger.error('Refresh token rejected, ending session', {
              reason: error.reason,
            });
            return { ...token, error: 'RefreshAccessTokenError' };
          }

          // The exchange never completed. The token is untouched and still the
          // one Keycloak expects, so the next attempt can simply try again.
          // Requests in the meantime fail on their own expiry, which the client
          // answers by refreshing rather than by giving up.
          logger.warn('Token refresh unavailable, leaving session intact', {
            reason: error instanceof Error ? error.message : 'unknown',
          });
          return token;
        }
      }

      if (token.provider === 'keycloak') {
        logger.warn('No refresh token available, ending session');
        return { ...token, error: 'RefreshAccessTokenError' };
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
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
