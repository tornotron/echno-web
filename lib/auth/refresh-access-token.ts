import { logger } from '@/lib/logger';
import { createRefreshSingleFlight } from './refresh-single-flight';
import type { KeycloakToken } from '@/types/keycloak';

/**
 * The Keycloak refresh-token exchange, and the judgement about what a failure
 * means.
 *
 * That judgement is the whole point of this module. The exchange used to map
 * every failure onto the same outcome, and that outcome invalidated the
 * session, so a momentary blip and a genuinely dead session were indis-
 * tinguishable to the user: both signed them out. They are not the same thing,
 * and only one of them is worth acting on.
 */

/**
 * The refresh token was refused and will be refused again.
 *
 * Keycloak answers `invalid_grant` when the token has expired, has already been
 * spent, or belongs to a chain it revoked. No amount of retrying changes any of
 * those, so this is the failure that genuinely ends a session.
 */
export class RefreshRejectedError extends Error {
  constructor(readonly reason: string) {
    super(`Refresh token rejected: ${reason}`);
    this.name = 'RefreshRejectedError';
  }
}

/**
 * The exchange did not complete, for reasons that say nothing about the token.
 *
 * A dropped connection or a Keycloak still starting up is a bad moment, not a
 * dead session. The refresh token is untouched and remains the one Keycloak
 * expects, so the right response is to leave the session alone and try again.
 */
export class RefreshUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefreshUnavailableError';
  }
}

/** Wait before the single retry of an exchange that did not complete. */
export const REFRESH_RETRY_DELAY_MS = 500;

/**
 * Statuses below 500 that still mean "not now" rather than "no".
 *
 * 408 is a request timeout and 429 is a rate limit. Both are the server's
 * moment passing, so both are worth one more attempt.
 */
const RETRYABLE_STATUSES = new Set([408, 429]);

/** Injectable seam, so the tests do not have to stand up a Keycloak. */
export interface RefreshDependencies {
  fetch: typeof globalThis.fetch;
  issuer: string;
  clientId: string;
  /** Pause between the failed attempt and the retry. */
  delay?: (ms: number) => Promise<void>;
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One round trip to the Keycloak token endpoint.
 *
 * @throws {RefreshRejectedError} when the token itself is no longer good.
 * @throws {RefreshUnavailableError} when the exchange could not be completed.
 */
export async function exchangeRefreshToken(
  token: KeycloakToken,
  dependencies: RefreshDependencies
): Promise<KeycloakToken> {
  let response: Response;
  try {
    response = await dependencies.fetch(
      `${dependencies.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: dependencies.clientId,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken || '',
        }),
      }
    );
  } catch (error) {
    throw new RefreshUnavailableError(
      error instanceof Error ? error.message : 'token endpoint unreachable'
    );
  }

  if (!response.ok) {
    // A 5xx is Keycloak having a bad time, which may well pass. So are 408 and
    // 429: a timeout and a rate limit say something about the server's moment,
    // not about the token, and both clear on their own. Treating either as a
    // refusal would skip the retry and end the session, which is the failure
    // this file exists to prevent. Everything else in the 4xx range is
    // Keycloak's verdict on the token, and that reads the same every time.
    if (response.status >= 500 || RETRYABLE_STATUSES.has(response.status)) {
      throw new RefreshUnavailableError(
        `token endpoint returned ${response.status}`
      );
    }

    const body = (await response
      .json()
      .catch(() => ({}))) as Record<string, unknown>;
    const reason = typeof body.error === 'string' ? body.error : 'unknown_error';
    throw new RefreshRejectedError(reason);
  }

  const refreshed = (await response.json()) as Record<string, number & string>;

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
}

/**
 * Builds a refresher that is safe to call from anywhere, any number of times.
 *
 * Two protections wrap the exchange and they answer different failures.
 *
 * The single flight makes a concurrent second caller share the first one's
 * result rather than post a token that has just been spent. Our realms treat a
 * replayed refresh token as a stolen one and revoke the entire chain, so a race
 * between a page waking up and a queued request recovering used to cost the
 * user their session outright. Sharing the result also covers the caller that
 * read the cookie a moment before the winner rewrote it, which is the same
 * collision arriving slightly late.
 *
 * The retry covers the other half: an exchange that never reached Keycloak
 * deserves one more attempt, where a token Keycloak has actually refused does
 * not. Retrying a refusal would only replay it.
 *
 * Each instance owns its own in-flight state, so a test can exercise one
 * without the application's.
 */
export function createAccessTokenRefresher(dependencies: RefreshDependencies) {
  const singleFlight = createRefreshSingleFlight<KeycloakToken>();
  const delay = dependencies.delay ?? defaultDelay;

  /**
   * Refreshes the Keycloak access token.
   *
   * @throws {RefreshRejectedError} when the session is genuinely over.
   * @throws {RefreshUnavailableError} when it is worth trying again later.
   */
  return async function refreshAccessToken(
    token: KeycloakToken
  ): Promise<KeycloakToken> {
    return singleFlight.run(token.refreshToken || '', async () => {
      try {
        return await exchangeRefreshToken(token, dependencies);
      } catch (error) {
        if (error instanceof RefreshRejectedError) {
          throw error;
        }

        logger.warn('Token refresh did not complete, retrying once', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
        await delay(REFRESH_RETRY_DELAY_MS);
        return await exchangeRefreshToken(token, dependencies);
      }
    });
  };
}
