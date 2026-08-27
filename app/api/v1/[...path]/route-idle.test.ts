import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { encode } from '@auth/core/jwt';
import { SESSION_ACTIVITY, SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';

/**
 * The idle deadline as the BFF proxy enforces it.
 *
 * The point of this suite is what it does not involve. There is no React, no
 * `useSession`, no `localStorage`: just a retained session cookie and the route
 * handler, which is exactly the shape of the thing the deadline is supposed to
 * stop. A test that drove the browser client would pass whether or not the
 * server enforced anything, because the client enforces it either way.
 */

const SECRET = 'idle-deadline-suite-secret-that-is-long-enough';
const COOKIE_NAME = 'authjs.session-token';

process.env.NEXTAUTH_SECRET = SECRET;
process.env.BACKEND_API_URL = 'http://backend.test/api/v1';

/** The Cookie header the mocked request carries, set per test. */
let cookieHeader = '';

// `getSessionTokens` reads the request cookies through `next/headers`, which
// only resolves inside a Next request scope.
mock.module('next/headers', () => ({
  cookies: async () => ({
    toString: () => cookieHeader,
  }),
}));

const { NextRequest } = await import('next/server');
const { GET } = await import('./route');

/** Requests the stubbed fetch saw, so a forward can be told from a refusal. */
let backendCalls: string[] = [];
const realFetch = globalThis.fetch;

const MINUTE_MS = 60 * 1000;

/**
 * Builds the encrypted session cookie NextAuth would have set for a session
 * whose last recorded activity was `idleMinutes` ago. The access token is
 * always comfortably valid, so nothing but the idle deadline can refuse it.
 */
async function retainedCookie(idleMinutes: number): Promise<string> {
  const value = await encode({
    token: {
      sessionId: 'retained-session',
      accessToken: 'retained-access-token',
      expiresAt: Date.now() + 5 * MINUTE_MS,
      lastActivityAt: Date.now() - idleMinutes * MINUTE_MS,
    },
    secret: SECRET,
    salt: COOKIE_NAME,
  });
  return `${COOKIE_NAME}=${value}`;
}

/** Runs the proxy for `GET /api/v1/user/web`. */
async function callProxy(): Promise<Response> {
  return GET(new NextRequest('http://localhost:3000/api/v1/user/web'), {
    params: Promise.resolve({ path: ['user', 'web'] }),
  });
}

beforeEach(() => {
  cookieHeader = '';
  backendCalls = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    backendCalls.push(String(input));
    return Response.json({ id: 7 }, { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Idle time past which the proxy refuses, in minutes. */
const PROXY_DEADLINE_MINUTES =
  (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS + SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS) /
  MINUTE_MS;

describe('a retained cookie with no client behind it', () => {
  test('is refused once the recorded idle deadline has passed', async () => {
    cookieHeader = await retainedCookie(PROXY_DEADLINE_MINUTES + 1);

    const response = await callProxy();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: SESSION_TOKEN_EXPIRED_ERROR,
    });
    expect(backendCalls).toHaveLength(0);
  });

  test('is refused however valid the access token it carries still is', async () => {
    // The whole gap this closes: the bearer in the cookie is fine, the session
    // behind it is not, and only the recorded activity says so.
    cookieHeader = await retainedCookie(PROXY_DEADLINE_MINUTES + 60);

    const response = await callProxy();

    expect(response.status).toBe(401);
    expect(backendCalls).toHaveLength(0);
  });
});

describe('a session that is still being used', () => {
  test('is forwarded when the recorded activity is recent', async () => {
    cookieHeader = await retainedCookie(1);

    await callProxy();

    expect(backendCalls).toHaveLength(1);
  });

  test('is forwarded on a timestamp as stale as a working client can leave it', async () => {
    // A user at the keyboard pushes activity every SERVER_SYNC_INTERVAL_MS, so
    // the proxy routinely reads a value that old, and older when a push had to
    // be retried. This is the case the grace exists for, and refusing it would
    // sign a working user out mid-request.
    const staleButWorking =
      (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS + SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS) /
      MINUTE_MS;
    cookieHeader = await retainedCookie(staleButWorking);

    await callProxy();

    expect(backendCalls).toHaveLength(1);
  });

  test('is forwarded when the token predates the recorded deadline', async () => {
    // Sessions minted before this shipped carry no timestamp. Failing closed on
    // them would sign every signed-in user out on deploy.
    const value = await encode({
      token: {
        sessionId: 'pre-existing-session',
        accessToken: 'retained-access-token',
        expiresAt: Date.now() + 5 * MINUTE_MS,
      },
      secret: SECRET,
      salt: COOKIE_NAME,
    });
    cookieHeader = `${COOKIE_NAME}=${value}`;

    await callProxy();

    expect(backendCalls).toHaveLength(1);
  });
});
