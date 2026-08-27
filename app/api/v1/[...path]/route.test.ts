import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { encode } from '@auth/core/jwt';
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';

/**
 * The BFF proxy, exercised as a route handler rather than through the browser
 * client.
 *
 * That distinction is the whole point of this suite. The recovery the API
 * client performs is keyed to a response body, so a test that drives the
 * client proves the client reads the body it was handed; it says nothing about
 * whether the proxy ever produces that body. Everything below builds a real
 * encrypted session cookie with NextAuth's own `encode`, hands it to the real
 * handler, and reads what comes back.
 */

const SECRET = 'route-handler-suite-secret-that-is-long-enough';
const COOKIE_NAME = 'authjs.session-token';

process.env.NEXTAUTH_SECRET = SECRET;
process.env.BACKEND_API_URL = 'http://backend.test/api/v1';

/** The Cookie header the mocked request carries, set per test. */
let cookieHeader = '';

// `getSessionTokens` reads the request cookies through `next/headers`, which
// only resolves inside a Next request scope. Standing in for it is what lets
// the handler run under the test runner.
mock.module('next/headers', () => ({
  cookies: async () => ({
    toString: () => cookieHeader,
    getAll: () =>
      cookieHeader
        .split('; ')
        .filter(Boolean)
        .map((pair) => {
          const separator = pair.indexOf('=');
          return {
            name: pair.slice(0, separator),
            value: pair.slice(separator + 1),
          };
        }),
  }),
}));

const { NextRequest } = await import('next/server');
const { GET } = await import('./route');
const { getSessionTokens } = await import('@/lib/auth/get-session-tokens');

/** Requests the stubbed fetch saw, so a forward can be told from a refusal. */
let backendCalls: { url: string; authorization: string | null }[] = [];
const realFetch = globalThis.fetch;

/** Builds the encrypted session cookie NextAuth would have set. */
async function sessionCookie(token: Record<string, unknown>): Promise<string> {
  const value = await encode({
    token,
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
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    backendCalls.push({
      url: String(input),
      authorization: headers.get('authorization'),
    });
    // What the backend says to a request it will not accept.
    return new Response('', { status: 401 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('what a null tokens means', () => {
  test('a session carrying an error still decodes, so null means something else', async () => {
    cookieHeader = await sessionCookie({
      sessionId: 'errored-session',
      error: 'RefreshAccessTokenError',
      accessToken: 'stale-access-token',
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // `getToken` decrypts the cookie and hands back whatever is inside it. It
    // has no opinion about an `error` field, so an errored session is not what
    // produces a null; a cookie that cannot be decrypted at all is.
    const tokens = await getSessionTokens();
    expect(tokens).not.toBeNull();
    expect(tokens?.error).toBe('RefreshAccessTokenError');
  });

  test('a cookie that cannot be decrypted is what produces a null', async () => {
    cookieHeader = `${COOKIE_NAME}=not-a-jwe`;

    expect(await getSessionTokens()).toBeNull();
  });
});

describe('a dead session', () => {
  test('is refused with the machine-readable code, not forwarded', async () => {
    cookieHeader = await sessionCookie({
      sessionId: 'errored-session',
      error: 'RefreshAccessTokenError',
      accessToken: 'stale-access-token',
      // Deliberately still valid: the access token is not the problem here, the
      // session is, and the expiry check alone would let this through.
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const response = await callProxy();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: SESSION_TOKEN_EXPIRED_ERROR,
    });
    expect(backendCalls).toHaveLength(0);
  });

  test('is refused the same way when its cookie no longer decodes', async () => {
    cookieHeader = `${COOKIE_NAME}=not-a-jwe`;

    const response = await callProxy();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: SESSION_TOKEN_EXPIRED_ERROR,
    });
    expect(backendCalls).toHaveLength(0);
  });

  test('is still refused when the access token is the part that lapsed', async () => {
    cookieHeader = await sessionCookie({
      sessionId: 'lapsed-session',
      accessToken: 'lapsed-access-token',
      expiresAt: Date.now() - 60 * 1000,
    });

    const response = await callProxy();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: SESSION_TOKEN_EXPIRED_ERROR,
    });
    expect(backendCalls).toHaveLength(0);
  });
});

describe('a request that is not carrying a session', () => {
  test('is forwarded untouched, so the backend decides', async () => {
    cookieHeader = '';

    await callProxy();

    expect(backendCalls).toHaveLength(1);
    expect(backendCalls[0].authorization).toBeNull();
  });

  test('is forwarded even when other cookies ride along', async () => {
    cookieHeader = 'theme=dark; sidebar=collapsed';

    await callProxy();

    expect(backendCalls).toHaveLength(1);
  });
});

describe('a live session', () => {
  test('is forwarded with its bearer', async () => {
    cookieHeader = await sessionCookie({
      sessionId: 'live-session',
      accessToken: 'live-access-token',
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await callProxy();

    expect(backendCalls).toHaveLength(1);
    expect(backendCalls[0].authorization).toBe('Bearer live-access-token');
  });
});
