import { describe, expect, test } from 'bun:test';
import {
  RefreshRejectedError,
  RefreshUnavailableError,
  createAccessTokenRefresher,
  type RefreshDependencies,
} from './refresh-access-token';
import type { KeycloakToken } from '@/types/keycloak';

const token = {
  provider: 'keycloak',
  refreshToken: 'refresh-1',
  accessToken: 'access-1',
  expiresAt: Date.now(),
} as KeycloakToken;

/** A successful token response, as Keycloak would send it. */
function tokenResponse(serial: number): Response {
  return Response.json({
    access_token: `access-${serial}`,
    refresh_token: `refresh-${serial}`,
    id_token: `id-${serial}`,
    expires_in: 300,
    refresh_expires_in: 1800,
  });
}

/** Keycloak refusing the token itself. */
function invalidGrant(reason: string): Response {
  return Response.json(
    { error: 'invalid_grant', error_description: reason },
    { status: 400 }
  );
}

/** Builds a refresher over a scripted sequence of responses. */
function refresherOver(
  respond: (attempt: number) => Response | Promise<Response>
) {
  const calls = { count: 0 };
  const dependencies: RefreshDependencies = {
    issuer: 'https://auth.example.test/realms/echno-realm',
    clientId: 'echno-web-client',
    // The retry pause is real time nobody needs to spend in a test.
    delay: async () => {},
    fetch: (async () => {
      calls.count++;
      return respond(calls.count);
    }) as unknown as typeof globalThis.fetch,
  };

  return { refresh: createAccessTokenRefresher(dependencies), calls };
}

describe('access token refresh', () => {
  test('a successful exchange carries the new tokens and clears any error', async () => {
    const { refresh } = refresherOver(() => tokenResponse(2));

    const refreshed = await refresh(token);

    expect(refreshed.accessToken).toBe('access-2');
    expect(refreshed.refreshToken).toBe('refresh-2');
    expect(refreshed.error).toBeUndefined();
  });

  test('concurrent callers exchange the same refresh token once', async () => {
    // The incident in one test. Both callers hold the cookie's refresh token;
    // an unguarded second exchange is a replay, and our realms answer a replay
    // by revoking the whole chain.
    const { refresh, calls } = refresherOver((attempt) =>
      attempt === 1
        ? tokenResponse(2)
        : invalidGrant('Maximum allowed refresh token reuse exceeded')
    );

    const [first, second] = await Promise.all([refresh(token), refresh(token)]);

    expect(calls.count).toBe(1);
    expect(first).toEqual(second);
    expect(first.accessToken).toBe('access-2');
  });

  test('a caller arriving just after the winner is served the same result', async () => {
    const { refresh, calls } = refresherOver((attempt) =>
      attempt === 1
        ? tokenResponse(2)
        : invalidGrant('Maximum allowed refresh token reuse exceeded')
    );

    const winner = await refresh(token);
    // A request that read the cookie before the winner rewrote it still holds
    // the spent token. Posting it would be the same replay, one beat later.
    const straggler = await refresh(token);

    expect(calls.count).toBe(1);
    expect(straggler).toEqual(winner);
  });

  test('a refused token ends the session and is not retried', async () => {
    const { refresh, calls } = refresherOver(() =>
      invalidGrant('Session not active')
    );

    await expect(refresh(token)).rejects.toBeInstanceOf(RefreshRejectedError);
    // Retrying a refusal would only replay it.
    expect(calls.count).toBe(1);
  });

  test('an unreachable endpoint is retried once and can succeed', async () => {
    const { refresh, calls } = refresherOver((attempt) => {
      if (attempt === 1) throw new Error('ECONNRESET');
      return tokenResponse(2);
    });

    const refreshed = await refresh(token);

    expect(calls.count).toBe(2);
    expect(refreshed.accessToken).toBe('access-2');
  });

  test('a failing Keycloak is retried once and reported as unavailable', async () => {
    const { refresh, calls } = refresherOver(
      () => new Response('upstream down', { status: 503 })
    );

    // Unavailable, not rejected: the session is intact and the caller should
    // leave it alone rather than sign the user out over a bad moment.
    await expect(refresh(token)).rejects.toBeInstanceOf(RefreshUnavailableError);
    expect(calls.count).toBe(2);
  });

  test('a rate limit is a bad moment, not a refusal', async () => {
    // 429 means Keycloak is busy. Reading it as a verdict on the token would
    // skip the retry and sign a working user out over someone else's traffic.
    const { refresh, calls } = refresherOver(
      () => new Response('slow down', { status: 429 })
    );

    await expect(refresh(token)).rejects.toBeInstanceOf(RefreshUnavailableError);
    expect(calls.count).toBe(2);
  });

  test('a request timeout is a bad moment, not a refusal', async () => {
    const { refresh, calls } = refresherOver(
      () => new Response('timed out', { status: 408 })
    );

    await expect(refresh(token)).rejects.toBeInstanceOf(RefreshUnavailableError);
    expect(calls.count).toBe(2);
  });

  test('a rate limit that clears is recovered by the retry', async () => {
    const { refresh } = refresherOver((attempt) =>
      attempt === 1 ? new Response('slow down', { status: 429 }) : tokenResponse(2)
    );

    const refreshed = await refresh(token);
    expect(refreshed.accessToken).toBe('access-2');
  });

  test('a transient failure does not poison the next attempt', async () => {
    const { refresh } = refresherOver((attempt) => {
      if (attempt <= 2) throw new Error('ECONNRESET');
      return tokenResponse(2);
    });

    await expect(refresh(token)).rejects.toBeInstanceOf(RefreshUnavailableError);
    // Nothing was cached, so the session recovers on its own once Keycloak is
    // back rather than staying stuck behind a remembered failure.
    const recovered = await refresh(token);
    expect(recovered.accessToken).toBe('access-2');
  });
});
