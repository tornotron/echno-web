import { describe, expect, test } from 'bun:test';
import { decode, encode } from '@auth/core/jwt';
import type { JWT } from 'next-auth/jwt';
import { SESSION_ACTIVITY } from '@/lib/auth/constants';

/**
 * The idle deadline as the `jwt()` callback enforces it, on the update path.
 *
 * What this suite is for is an ordering rule, so it drives the real callback
 * rather than a restatement of it. `authConfig` exists to make that possible.
 * A test that rebuilt the sequence would agree with itself whatever the
 * callback did, which is the same reason the proxy suite refuses to go through
 * the browser client.
 *
 * The token each test passes in is decoded from a session cookie that was
 * really encrypted, so it is the shape NextAuth hands the callback and not a
 * convenient stand-in. The case that matters is the one where that cookie
 * arrives carrying activity already older than the deadline: the session has
 * to end, and an assertion that somebody is present must not rescue it.
 */

const SECRET = 'jwt-idle-deadline-suite-secret-that-is-long-enough';
const COOKIE_NAME = 'authjs.session-token';

process.env.NEXTAUTH_SECRET = SECRET;

const { authConfig } = await import('@/auth');

const MINUTE_MS = 60 * 1000;
const DEADLINE_MINUTES = SESSION_ACTIVITY.IDLE_SIGN_OUT_MS / MINUTE_MS;

/**
 * The token NextAuth would hand `jwt()` for a session whose last recorded
 * activity was `idleMinutes` ago.
 *
 * Round-tripped through the real encrypt and decrypt so the callback sees a
 * token that genuinely came out of a cookie. The access token is left
 * comfortably valid, so the callback returns before the refresh path and
 * nothing but the deadline can decide the outcome.
 */
async function tokenFromCookie(
  idleMinutes: number | null
): Promise<JWT & { lastActivityAt?: number }> {
  const token: Record<string, unknown> = {
    sessionId: 'retained-session',
    provider: 'keycloak',
    accessToken: 'retained-access-token',
    refreshToken: 'retained-refresh-token',
    expiresAt: Date.now() + 60 * MINUTE_MS,
  };
  if (idleMinutes !== null) {
    token.lastActivityAt = Date.now() - idleMinutes * MINUTE_MS;
  }

  const cookie = await encode({ token, secret: SECRET, salt: COOKIE_NAME });
  const decoded = await decode({
    token: cookie,
    secret: SECRET,
    salt: COOKIE_NAME,
  });

  return decoded as JWT & { lastActivityAt?: number };
}

/** Runs the real `jwt()` callback for a session update. */
async function runUpdate(
  token: JWT,
  payload: unknown
): Promise<JWT & { error?: string; lastActivityAt?: number }> {
  const jwt = authConfig.callbacks.jwt as (params: {
    token: JWT;
    trigger?: string;
    session?: unknown;
  }) => Promise<JWT>;

  const result = await jwt({ token, trigger: 'update', session: payload });
  return result as JWT & { error?: string; lastActivityAt?: number };
}

describe('a session update arriving after the idle deadline', () => {
  test('ends the session rather than renewing it', async () => {
    const token = await tokenFromCookie(DEADLINE_MINUTES + 1);

    const result = await runUpdate(token, { activity: true });

    expect(result.error).toBe('SessionIdleTimeout');
  });

  test('does not advance the recorded activity it was refused on', async () => {
    // The evidence the refusal was based on has to survive it. Stamping the
    // clock on the way out would leave a token that says the session was alive
    // at the moment it was declared over.
    const token = await tokenFromCookie(DEADLINE_MINUTES + 1);
    const arrivedWith = token.lastActivityAt;

    const result = await runUpdate(token, { activity: true });

    expect(result.lastActivityAt).toBe(arrivedWith);
  });

  test('ends it however long the assertion has been arriving for', async () => {
    // The gap this closes: an assertion is a plain POST to the session
    // endpoint, so anything holding the cookie can send one. If it advanced the
    // clock, the deadline would be unreachable on the only path that renews a
    // session and the holder of the cookie would decide when it ended.
    const token = await tokenFromCookie(DEADLINE_MINUTES + 240);

    const result = await runUpdate(token, { activity: true });

    expect(result.error).toBe('SessionIdleTimeout');
  });

  test('ends it when the update carries no assertion at all', async () => {
    const token = await tokenFromCookie(DEADLINE_MINUTES + 1);

    const result = await runUpdate(token, undefined);

    expect(result.error).toBe('SessionIdleTimeout');
  });
});

describe('a session update arriving inside the deadline', () => {
  test('renews the recorded activity and leaves the session alone', async () => {
    const token = await tokenFromCookie(1);
    const arrivedWith = token.lastActivityAt as number;

    const result = await runUpdate(token, { activity: true });

    expect(result.error).toBeUndefined();
    expect(result.lastActivityAt).toBeGreaterThan(arrivedWith);
  });

  test('renews on a timestamp as stale as a working client can leave it', async () => {
    // A client at the keyboard pushes every SERVER_SYNC_INTERVAL_MS, and a push
    // that fails is retried on the next evaluation tick rather than the next
    // interval, because `lastSyncedAt` only advances on success. So the server's
    // copy sits far inside the deadline for anyone actually working, which is
    // why the check here needs no tolerance of its own.
    const stale =
      SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS / MINUTE_MS +
      SESSION_ACTIVITY.EVALUATION_INTERVAL_MS / MINUTE_MS;
    const token = await tokenFromCookie(stale);
    const arrivedWith = token.lastActivityAt as number;

    const result = await runUpdate(token, { activity: true });

    expect(result.error).toBeUndefined();
    expect(result.lastActivityAt).toBeGreaterThan(arrivedWith);
  });

  test('leaves a plain keep-alive without an assertion where it was', async () => {
    // The distinction the whole mechanism rests on: a tab running on a timer
    // renews its access token without claiming anybody is present.
    const token = await tokenFromCookie(1);
    const arrivedWith = token.lastActivityAt;

    const result = await runUpdate(token, undefined);

    expect(result.error).toBeUndefined();
    expect(result.lastActivityAt).toBe(arrivedWith);
  });
});

describe('a token minted before the deadline was recorded', () => {
  test('is left alone rather than signed out on deploy', async () => {
    const token = await tokenFromCookie(null);

    const result = await runUpdate(token, { activity: true });

    expect(result.error).toBeUndefined();
  });
});
