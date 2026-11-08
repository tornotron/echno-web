/**
 * A stand-in for WorkOS, for the suites that drive the WorkOS sign-in.
 *
 * The real `authkit-nextjs` runs in those suites: its sealing, its PKCE check, its token
 * verification and its refresh. What is replaced is the network. `globalThis.fetch` answers for the
 * WorkOS API (signing keys, the code and refresh exchanges, session revoke) and for the backend,
 * and access tokens are signed here with a key whose public half the fake JWKS serves. Nothing
 * leaves the process.
 *
 * `next/headers` is replaced too, since `cookies()` and `headers()` only resolve inside a Next
 * request. The cookie jar it serves is the one the library writes to in route handlers.
 *
 * The library reads its environment once, when it is first imported, so every suite uses the same
 * values from here, and they are set before anything imports it. Suites call {@link installWorkosFake}
 * in `beforeAll` and {@link uninstallWorkosFake} in `afterAll`.
 */
import { mock } from 'bun:test';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextRequest } from 'next/server';

export const CLIENT_ID = 'client_test_echno';
export const ISSUER = `https://api.workos.com/user_management/${CLIENT_ID}`;
export const PUBLIC_ORIGIN = 'https://app.example.test';
export const REDIRECT_URI = `${PUBLIC_ORIGIN}/callback`;
export const BACKEND_URL = 'http://backend.test/api/v1';
export const ORGANIZATION_ID = '42';
export const USER = {
  id: 'user_test_01',
  email: 'site.engineer@example.org',
  firstName: 'Asha',
  lastName: 'Menon',
};

const ENVIRONMENT: Record<string, string> = {
  AUTH_PROVIDER: 'workos',
  WORKOS_API_KEY: 'sk_test_not_a_real_key',
  WORKOS_CLIENT_ID: CLIENT_ID,
  WORKOS_COOKIE_PASSWORD: 'a-test-cookie-password-that-is-long-enough-for-iron',
  WORKOS_ISSUER: ISSUER,
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: REDIRECT_URI,
  ECHNO_SESSION_ACTIVITY_SECRET: 'a-test-activity-secret-that-is-long-enough',
  BACKEND_API_URL: BACKEND_URL,
};

// The library has `import 'server-only'`, which throws outside Next's server bundle.
mock.module('server-only', () => ({}));

/** Cookies as the route handlers see them through `cookies()`. */
export const cookieJar = new Map<string, string>();
/** The request headers `headers()` returns. */
export let requestHeaders = new Headers();

export function setRequestHeaders(headers: HeadersInit): void {
  requestHeaders = new Headers(headers);
}

type CookieArgument =
  | string
  | { name: string; value?: string; maxAge?: number; expires?: Date };

mock.module('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name)
        ? { name, value: cookieJar.get(name) as string }
        : undefined,
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
    has: (name: string) => cookieJar.has(name),
    set: (
      nameOrCookie: CookieArgument,
      value?: string,
      options?: { maxAge?: number; expires?: Date }
    ) => {
      const cookie =
        typeof nameOrCookie === 'string'
          ? { name: nameOrCookie, value: value ?? '', ...options }
          : nameOrCookie;
      const expired =
        cookie.maxAge === 0 ||
        (cookie.expires !== undefined &&
          cookie.expires.getTime() <= Date.now());
      if (expired || cookie.value === '') {
        cookieJar.delete(cookie.name);
      } else {
        cookieJar.set(cookie.name, cookie.value ?? '');
      }
    },
    delete: (nameOrCookie: CookieArgument) => {
      cookieJar.delete(
        typeof nameOrCookie === 'string' ? nameOrCookie : nameOrCookie.name
      );
    },
    toString: () =>
      [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; '),
  }),
  headers: async () => requestHeaders,
}));

/** What the fake saw, so a suite can tell a forward from a refusal. */
export const calls = {
  backend: [] as {
    url: string;
    authorization: string | null;
    organization: string | null;
  }[],
  authenticate: [] as Record<string, unknown>[],
  revoked: [] as string[],
};

/** Set to make the next refresh exchange answer `invalid_grant`. */
export const behaviour = { refuseRefresh: false };

let signingKey: CryptoKey;
let publicJwk: Record<string, unknown>;
let sessionCounter = 0;
const savedEnvironment: Record<string, string | undefined> = {};
const realFetch = globalThis.fetch;

/** An access token as WorkOS would issue it. `lifetimeSeconds` defaults to five minutes. */
export async function issueAccessToken(
  sessionId: string,
  lifetimeSeconds = 300
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sid: sessionId, client_id: CLIENT_ID })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setSubject(USER.id)
    .setIssuer(ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + lifetimeSeconds)
    .sign(signingKey);
}

/** The lifetime the next issued access token gets, so a suite can make one close to expiry. */
export const tokenLifetime = { seconds: 300 };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function workosUser() {
  const at = new Date().toISOString();
  return {
    object: 'user',
    id: USER.id,
    email: USER.email,
    email_verified: true,
    first_name: USER.firstName,
    last_name: USER.lastName,
    profile_picture_url: null,
    last_sign_in_at: at,
    created_at: at,
    updated_at: at,
    external_id: null,
    metadata: {},
  };
}

async function fakeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const request = new Request(input, init);
  const url = new URL(request.url);

  if (url.origin === new URL(BACKEND_URL).origin) {
    calls.backend.push({
      url: request.url,
      authorization: request.headers.get('authorization'),
      organization: request.headers.get('x-organization-id'),
    });
    if (url.pathname.endsWith('/user/web')) {
      return json({ id: 7, defaultOrganizationId: Number(ORGANIZATION_ID) });
    }
    return json({ ok: true });
  }

  if (url.origin !== 'https://api.workos.com') {
    throw new Error(`Unexpected request in a WorkOS suite: ${request.url}`);
  }

  if (url.pathname === `/sso/jwks/${CLIENT_ID}`) {
    return json({ keys: [publicJwk] });
  }

  if (url.pathname === '/user_management/authenticate') {
    const body = (await request.json()) as Record<string, unknown>;
    calls.authenticate.push(body);
    if (body.grant_type === 'refresh_token' && behaviour.refuseRefresh) {
      return json(
        {
          error: 'invalid_grant',
          error_description: 'Session has already ended.',
        },
        400
      );
    }
    sessionCounter += body.grant_type === 'authorization_code' ? 1 : 0;
    const sessionId = `session_test_${sessionCounter}`;
    return json({
      user: workosUser(),
      access_token: await issueAccessToken(sessionId, tokenLifetime.seconds),
      refresh_token: `refresh_${sessionId}_${calls.authenticate.length}`,
      authentication_method: 'Password',
    });
  }

  if (url.pathname === '/user_management/sessions/revoke') {
    const body = (await request.json()) as { session_id: string };
    calls.revoked.push(body.session_id);
    return json({});
  }

  throw new Error(`Unexpected WorkOS call: ${request.method} ${url.pathname}`);
}

export async function installWorkosFake(): Promise<void> {
  for (const [name, value] of Object.entries(ENVIRONMENT)) {
    savedEnvironment[name] = process.env[name];
    process.env[name] = value;
  }
  if (!signingKey) {
    const pair = await generateKeyPair('RS256', { extractable: true });
    signingKey = pair.privateKey;
    publicJwk = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'test-key',
      alg: 'RS256',
      use: 'sig',
    };
  }
  globalThis.fetch = fakeFetch as typeof fetch;
  resetWorkosFake();
}

export function resetWorkosFake(): void {
  cookieJar.clear();
  requestHeaders = new Headers();
  calls.backend.length = 0;
  calls.authenticate.length = 0;
  calls.revoked.length = 0;
  behaviour.refuseRefresh = false;
  tokenLifetime.seconds = 300;
  sessionCounter = 0;
}

export function uninstallWorkosFake(): void {
  globalThis.fetch = realFetch;
  for (const [name, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

/**
 * A `NextRequest` that keeps its `Cookie` and `Origin` headers.
 *
 * The test preload registers happy-dom, whose `Request` drops the headers a browser may not set by
 * hand, and those are the two these suites are about. The request is built without them and given
 * a plain `Headers` afterwards, with the cookie view rebuilt on top of it.
 */
export function requestWith(
  url: string,
  init: { method?: string; headers?: HeadersInit; body?: BodyInit } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  const request = new NextRequest(url, {
    method: init.method ?? 'GET',
    body: init.body,
  });
  const contentType = request.headers.get('content-type');
  if (contentType && !headers.has('content-type')) {
    headers.set('content-type', contentType);
  }
  Object.defineProperty(request, 'headers', { value: headers });
  Object.defineProperty(request, 'cookies', {
    value: new RequestCookies(headers),
  });
  return request;
}

/** The cookie header for what is in the jar. */
export function cookieHeader(): string {
  return [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; ');
}

/**
 * The request headers a proxy response forwards downstream, decoded from the
 * `x-middleware-request-*` headers Next uses to carry them.
 */
export function forwardedRequestHeaders(response: Response): Headers {
  const names = response.headers.get('x-middleware-override-headers') ?? '';
  const headers = new Headers();
  for (const name of names.split(',').filter(Boolean)) {
    const value = response.headers.get(`x-middleware-request-${name}`);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

/** Applies a response's `Set-Cookie` headers to the jar, as a browser would. */
export function storeResponseCookies(response: Response): void {
  for (const header of response.headers.getSetCookie()) {
    const [pair, ...attributes] = header.split(';');
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    const expired = attributes.some((attribute) => {
      const [key, raw] = attribute.trim().split('=');
      const lower = key.toLowerCase();
      if (lower === 'max-age') return Number(raw) <= 0;
      if (lower === 'expires') return new Date(raw).getTime() <= Date.now();
      return false;
    });
    if (expired || value === '') cookieJar.delete(name);
    else cookieJar.set(name, value);
  }
}
