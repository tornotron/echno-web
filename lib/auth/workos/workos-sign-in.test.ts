import {
  afterAll,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from 'bun:test';
import type { NextFetchEvent } from 'next/server';

import {
  BACKEND_URL,
  CLIENT_ID,
  ORGANIZATION_ID,
  PUBLIC_ORIGIN,
  REDIRECT_URI,
  USER,
  behaviour,
  calls,
  cookieHeader,
  cookieJar,
  forwardedRequestHeaders,
  installWorkosFake,
  requestWith,
  resetWorkosFake,
  setRequestHeaders,
  storeResponseCookies,
  tokenLifetime,
  uninstallWorkosFake,
} from '@/test/workos-fake';

/**
 * The WorkOS sign-in, end to end, against a WorkOS that lives in this process.
 *
 * The library is the real `authkit-nextjs`; only the network and `next/headers` are replaced
 * (`test/workos-fake.ts`). Each flow goes the way a browser would take it: `/sign-in`, then
 * `/callback` with the state AuthKit would hand back, then pages through the proxy, the BFF, the
 * session endpoint, and `/sign-out`. The container is addressed as `app.internal:3000` throughout,
 * the way a reverse proxy reaches it, so a redirect that leaked the internal host would show.
 */

await installWorkosFake();

const {
  workosCallbackRoute,
  workosSessionRoute,
  workosSignInRoute,
  workosSignOutRoute,
} = await import('@/lib/auth/server');
const { GET: bffGet } = await import('@/app/api/v1/[...path]/route');
const { default: proxy } = await import('@/proxy');
const { ACTIVITY_COOKIE_NAME, readSessionActivity, sealSessionActivity } =
  await import('@/lib/auth/workos/activity-cookie');
const { SESSION_ACTIVITY, SESSION_TOKEN_EXPIRED_ERROR } =
  await import('@/lib/auth/constants');

const INTERNAL = 'http://app.internal:3000';
const SECRET = process.env.ECHNO_SESSION_ACTIVITY_SECRET as string;

afterAll(() => {
  uninstallWorkosFake();
});

beforeEach(() => {
  resetWorkosFake();
});

/** Signs in through `/sign-in` and `/callback`, leaving the session cookies in the jar. */
async function signIn(callbackUrl = '/users/dashboard/projects') {
  setRequestHeaders({ host: 'app.internal:3000' });
  const start = await workosSignInRoute(
    requestWith(
      `${INTERNAL}/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    )
  );
  const authorize = new URL(start.headers.get('location') ?? '');

  // AuthKit shows its page, then sends the browser back with a code and the same state.
  const state = authorize.searchParams.get('state') ?? '';
  const callback = await workosCallbackRoute(
    requestWith(
      `${INTERNAL}/callback?code=code_test&state=${encodeURIComponent(state)}`,
      { headers: { cookie: cookieHeader(), accept: 'text/html' } }
    )
  );
  storeResponseCookies(callback);
  return { start, authorize, callback };
}

type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
};

function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cookie', cookieHeader());
  return requestWith(`${INTERNAL}${path}`, { ...init, headers });
}

async function callBff(path = 'projects') {
  return bffGet(apiRequest(`/api/v1/${path}`), {
    params: Promise.resolve({ path: path.split('/') }),
  });
}

async function runProxy(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cookie', cookieHeader());
  if (!headers.has('accept')) headers.set('accept', 'text/html');
  return proxy(
    requestWith(`${INTERNAL}${path}`, { ...init, headers }),
    {} as NextFetchEvent
  );
}

async function currentActivity() {
  return readSessionActivity(cookieJar.get(ACTIVITY_COOKIE_NAME), SECRET);
}

/** Rewrites the activity cookie as if the last activity was `minutes` ago. */
async function idleFor(minutes: number) {
  const activity = await currentActivity();
  if (!activity) throw new Error('no activity cookie to age');
  cookieJar.set(
    ACTIVITY_COOKIE_NAME,
    await sealSessionActivity(
      { ...activity, at: Date.now() - minutes * 60 * 1000 },
      SECRET
    )
  );
}

describe('sign-in', () => {
  test('sends the browser to AuthKit with the redirect URI read at run time', async () => {
    const { start, authorize } = await signIn();

    expect(start.status).toBe(307);
    expect(authorize.origin).toBe('https://api.workos.com');
    expect(authorize.pathname).toBe('/user_management/authorize');
    expect(authorize.searchParams.get('client_id')).toBe(CLIENT_ID);
    expect(authorize.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
  });

  test('follows a redirect URI changed after the library loaded', async () => {
    // The library read the variable when it was imported. A value set later reaching WorkOS is
    // what shows the app reads it per request and hands it over itself.
    const later = 'https://other.example.test/callback';
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = later;
    try {
      const start = await workosSignInRoute(requestWith(`${INTERNAL}/sign-in`));
      const authorize = new URL(start.headers.get('location') ?? '');
      expect(authorize.searchParams.get('redirect_uri')).toBe(later);
    } finally {
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = REDIRECT_URI;
    }
  });

  test('the callback lands on the public origin, at the page sign-in started from', async () => {
    const { callback } = await signIn('/users/dashboard/projects');

    expect(callback.status).toBe(307);
    expect(callback.headers.get('location')).toBe(
      `${PUBLIC_ORIGIN}/users/dashboard/projects`
    );
    const exchange = calls.authenticate.at(-1);
    expect(exchange?.grant_type).toBe('authorization_code');
    expect(exchange?.code).toBe('code_test');
    expect(typeof exchange?.code_verifier).toBe('string');
  });

  test('an unsafe landing page is replaced by the dashboard', async () => {
    const { callback } = await signIn('//evil.example.test/');
    expect(callback.headers.get('location')).toBe(
      `${PUBLIC_ORIGIN}/users/dashboard`
    );
  });

  test('starts the idle clock and records the organization from the backend', async () => {
    const before = Date.now();
    await signIn();

    expect(cookieJar.has('wos-session')).toBe(true);
    const activity = await currentActivity();
    expect(activity?.sid).toBe('session_test_1');
    expect(activity?.org).toBe(ORGANIZATION_ID);
    expect(activity?.at).toBeGreaterThanOrEqual(before);

    const profile = calls.backend.find((call) =>
      call.url.endsWith('/user/web')
    );
    expect(profile?.authorization).toStartWith('Bearer ');
  });

  test('a callback whose state matches no verifier cookie fails to the landing page', async () => {
    const callback = await workosCallbackRoute(
      requestWith(`${INTERNAL}/callback?code=code_test&state=forged`)
    );
    expect(callback.headers.get('location')).toBe(
      `${PUBLIC_ORIGIN}/?error=Callback`
    );
    expect(cookieJar.has('wos-session')).toBe(false);
    expect(calls.authenticate).toHaveLength(0);
  });
});

describe('the session the browser reads', () => {
  test('has the Auth.js shape, the organization, and no token', async () => {
    await signIn();
    const res = await workosSessionRoute(apiRequest('/api/session'));
    const session = await res.json();

    expect(session.provider).toBe('workos');
    expect(session.sessionId).toBe('session_test_1');
    expect(session.user).toEqual({
      id: USER.id,
      email: USER.email,
      name: `${USER.firstName} ${USER.lastName}`,
      defaultOrganizationId: ORGANIZATION_ID,
    });
    expect(JSON.stringify(session)).not.toContain('eyJ');
  });

  test('is null with no session cookie', async () => {
    const res = await workosSessionRoute(apiRequest('/api/session'));
    expect(await res.json()).toBeNull();
  });

  test('an activity assertion moves the deadline on the server clock', async () => {
    await signIn();
    await idleFor(10);
    const stale = await currentActivity();

    const res = await workosSessionRoute(
      apiRequest('/api/session', {
        method: 'POST',
        headers: { origin: PUBLIC_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify({ activity: true, at: 0 }),
      })
    );
    storeResponseCookies(res);
    const renewed = await currentActivity();

    expect(res.status).toBe(200);
    expect(renewed?.sid).toBe(stale?.sid);
    expect(renewed?.at).toBeGreaterThan((stale?.at ?? 0) + 9 * 60 * 1000);
  });

  test('an assertion does not revive a session past its deadline', async () => {
    await signIn();
    await idleFor(SESSION_ACTIVITY.IDLE_SIGN_OUT_MS / 60_000 + 1);
    const before = cookieJar.get(ACTIVITY_COOKIE_NAME);

    const res = await workosSessionRoute(
      apiRequest('/api/session', {
        method: 'POST',
        headers: { origin: PUBLIC_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify({ activity: true }),
      })
    );
    storeResponseCookies(res);

    const session = await res.json();
    expect(session.error).toBe('SessionIdleTimeout');
    expect(cookieJar.get(ACTIVITY_COOKIE_NAME)).toBe(before);
  });

  test('a state change from another origin is refused', async () => {
    await signIn();
    const res = await workosSessionRoute(
      apiRequest('/api/session', {
        method: 'POST',
        headers: { origin: 'https://evil.example.test' },
        body: JSON.stringify({ activity: true }),
      })
    );
    expect(res.status).toBe(403);
  });

  test('a session with its activity cookie removed has ended', async () => {
    await signIn();
    cookieJar.delete(ACTIVITY_COOKIE_NAME);
    const res = await workosSessionRoute(apiRequest('/api/session'));
    const session = await res.json();
    expect(session.error).toBe('SessionIdleTimeout');
  });

  test('a forged activity cookie does not count', async () => {
    await signIn();
    const activity = await currentActivity();
    cookieJar.set(
      ACTIVITY_COOKIE_NAME,
      await sealSessionActivity(
        { sid: activity?.sid ?? '', at: Date.now() },
        'a-different-secret-that-is-long-enough-too'
      )
    );
    const res = await workosSessionRoute(apiRequest('/api/session'));
    const session = await res.json();
    expect(session.error).toBe('SessionIdleTimeout');
  });
});

describe('the BFF', () => {
  test('forwards the access token and the organization', async () => {
    await signIn();
    calls.backend.length = 0;

    const res = await callBff('projects');

    expect(res.status).toBe(200);
    expect(calls.backend).toHaveLength(1);
    expect(calls.backend[0].url).toBe(`${BACKEND_URL}/projects`);
    expect(calls.backend[0].authorization).toMatch(/^Bearer eyJ/);
    expect(calls.backend[0].organization).toBe(ORGANIZATION_ID);
  });

  test('forwards an anonymous call without a bearer', async () => {
    const res = await callBff('plans');
    expect(res.status).toBe(200);
    expect(calls.backend[0].authorization).toBeNull();
  });

  test('refreshes a token close to expiry and hands the new cookie back', async () => {
    tokenLifetime.seconds = 10;
    await signIn();
    const sealedBefore = cookieJar.get('wos-session');
    tokenLifetime.seconds = 300;
    calls.backend.length = 0;

    const res = await callBff('projects');

    expect(calls.authenticate.at(-1)?.grant_type).toBe('refresh_token');
    expect(res.headers.getSetCookie().join('\n')).toContain('wos-session=');
    storeResponseCookies(res);
    expect(cookieJar.get('wos-session')).not.toBe(sealedBefore);
    expect(calls.backend[0].authorization).toMatch(/^Bearer eyJ/);
  });

  test('refuses a session WorkOS no longer refreshes, with the code the client recovers from', async () => {
    await signIn();
    behaviour.refuseRefresh = true;
    calls.backend.length = 0;

    // Ten minutes on: the access token has expired and the refresh is refused (`invalid_grant`).
    setSystemTime(new Date(Date.now() + 10 * 60 * 1000));
    try {
      const res = await callBff('projects');

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: SESSION_TOKEN_EXPIRED_ERROR });
      expect(calls.backend).toHaveLength(0);
      // The dead cookie is cleared rather than left to fail on every request.
      expect(res.headers.getSetCookie().join('\n')).toMatch(
        /wos-session=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i
      );
    } finally {
      setSystemTime();
    }
  });

  test('a proactive refresh that fails keeps serving the still-valid token', async () => {
    tokenLifetime.seconds = 10;
    await signIn();
    behaviour.refuseRefresh = true;
    calls.backend.length = 0;

    const res = await callBff('projects');

    expect(res.status).toBe(200);
    expect(calls.backend[0].authorization).toMatch(/^Bearer eyJ/);
  });

  test('refuses a session idle past its deadline without refreshing it', async () => {
    await signIn();
    const exchanges = calls.authenticate.length;
    await idleFor(
      (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS +
        SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS) /
        60_000 +
        1
    );
    calls.backend.length = 0;

    const res = await callBff('projects');

    expect(res.status).toBe(401);
    expect(calls.backend).toHaveLength(0);
    expect(calls.authenticate).toHaveLength(exchanges);
  });

  test('allows the proxy grace on top of the deadline', async () => {
    await signIn();
    await idleFor(SESSION_ACTIVITY.IDLE_SIGN_OUT_MS / 60_000 + 1);
    calls.backend.length = 0;

    const res = await callBff('projects');
    expect(res.status).toBe(200);
    expect(calls.backend).toHaveLength(1);
  });
});

describe('the proxy', () => {
  test('sends an anonymous visitor on a protected page to the landing page', async () => {
    const res = await runProxy('/users/dashboard/projects');
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.pathname).toBe('/');
    expect(location.searchParams.get('callbackUrl')).toBe(
      '/users/dashboard/projects'
    );
    expect(res.headers.get('content-security-policy')).toContain('form-action');
    // No PKCE verifier cookie for a flow the app never starts from here.
    expect(res.headers.getSetCookie().join('\n')).not.toContain(
      'wos-auth-verifier'
    );
  });

  test('passes a signed-in page through with the session for withAuth and the nonce', async () => {
    await signIn();
    const res = await runProxy('/users/dashboard/projects');
    const forwarded = forwardedRequestHeaders(res);

    expect(res.headers.get('location')).toBeNull();
    expect(forwarded.get('x-workos-middleware')).toBe('true');
    expect(forwarded.get('x-workos-session')).toBeTruthy();
    expect(forwarded.get('x-redirect-uri')).toBe(REDIRECT_URI);
    expect(forwarded.get('x-nonce')).toBeTruthy();
    expect(res.headers.get('content-security-policy')).toContain(
      `'nonce-${forwarded.get('x-nonce')}'`
    );
  });

  test('drops a session header the browser sent itself', async () => {
    const res = await runProxy('/users/dashboard/projects', {
      headers: { 'x-workos-session': 'forged', 'x-workos-middleware': 'true' },
    });
    const forwarded = forwardedRequestHeaders(res);
    expect(forwarded.get('x-workos-session')).toBeNull();
  });

  test('sends a signed-in visitor from the landing page to the dashboard', async () => {
    await signIn();
    const res = await runProxy('/');
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe(
      '/users/dashboard'
    );
  });

  test('ends a session idle past its deadline', async () => {
    await signIn();
    await idleFor(SESSION_ACTIVITY.IDLE_SIGN_OUT_MS / 60_000 + 1);
    const res = await runProxy('/users/dashboard/projects');
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.pathname).toBe('/');
    expect(location.searchParams.get('error')).toBe('SessionExpired');
  });
});

describe('sign-out', () => {
  test('goes through WorkOS hosted logout and back to this origin, as a 303', async () => {
    await signIn();

    // The proxy runs in front of `/sign-out` and leaves the session for `withAuth()`.
    const body = new URLSearchParams({ callbackUrl: '/?logout=success' });
    const proxied = await runProxy('/sign-out', { method: 'POST' });
    const headers = forwardedRequestHeaders(proxied);
    headers.set('cookie', cookieHeader());
    headers.set('content-type', 'application/x-www-form-urlencoded');
    setRequestHeaders(headers);

    const res = await workosSignOutRoute(
      requestWith(`${INTERNAL}/sign-out`, {
        method: 'POST',
        headers,
        body,
      })
    );

    expect(res.status).toBe(303);
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.origin).toBe('https://api.workos.com');
    expect(location.pathname).toBe('/user_management/sessions/logout');
    expect(location.searchParams.get('session_id')).toBe('session_test_1');
    expect(location.searchParams.get('return_to')).toBe(
      `${PUBLIC_ORIGIN}/?logout=success`
    );
    expect(cookieJar.has('wos-session')).toBe(false);
    expect(cookieJar.has(ACTIVITY_COOKIE_NAME)).toBe(false);
  });

  test('a sign-out that names another site returns to this one', async () => {
    await signIn();
    const proxied = await runProxy('/sign-out', { method: 'POST' });
    const headers = forwardedRequestHeaders(proxied);
    headers.set('content-type', 'application/x-www-form-urlencoded');
    setRequestHeaders(headers);

    const res = await workosSignOutRoute(
      requestWith(`${INTERNAL}/sign-out`, {
        method: 'POST',
        headers,
        body: new URLSearchParams({ callbackUrl: 'https://evil.example.test' }),
      })
    );
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.searchParams.get('return_to')).toBe(`${PUBLIC_ORIGIN}/`);
  });

  test('in place: revokes the WorkOS session and clears both cookies', async () => {
    await signIn();
    const res = await workosSessionRoute(
      apiRequest('/api/session', {
        method: 'DELETE',
        headers: { origin: PUBLIC_ORIGIN },
      })
    );
    storeResponseCookies(res);

    expect(await res.json()).toBeNull();
    expect(calls.revoked).toEqual(['session_test_1']);
    expect(cookieJar.has('wos-session')).toBe(false);
    expect(cookieJar.has(ACTIVITY_COOKIE_NAME)).toBe(false);
  });
});
