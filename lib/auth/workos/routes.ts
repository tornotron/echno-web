import {
  getSignInUrl,
  getWorkOS,
  handleAuth,
  signOut,
} from '@workos-inc/authkit-nextjs';
import { decodeJwt } from 'jose';
import { getURLFromRedirectError } from 'next/dist/client/components/redirect';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { applyAuthResponseHeaders } from '@/lib/auth/bff-caller';
import { TOKEN_REFRESH } from '@/lib/auth/constants';
import { isActivityAssertion } from '@/lib/auth/session-idle';
import { signInRedirectTarget } from '@/lib/auth/sign-in-flow';
import {
  ACTIVITY_COOKIE_NAME,
  activityCookieOptions,
  sealSessionActivity,
} from '@/lib/auth/workos/activity-cookie';
import {
  readWorkosRequestSession,
  responseHeadersFrom,
  sessionForState,
} from '@/lib/auth/workos/session';
import { getWorkosSettings } from '@/lib/auth/workos/settings';
import { logger } from '@/lib/logger';

/**
 * The WorkOS routes: sign-in, callback, sign-out, and the session endpoint the browser uses.
 * `lib/auth/server.ts` answers 404 for each of them under Keycloak before this module loads.
 */

/**
 * `GET /sign-in`. Sends the browser to AuthKit with the redirect URI read now, and with where to
 * land afterwards (`callbackUrl`, checked the same way the Keycloak sign-in checks it).
 *
 * This is also the Initiate login URI set in WorkOS. The library enforces PKCE on every callback,
 * so a sign-in WorkOS starts itself (an invitation link, for one) has to come through here to get
 * a verifier cookie before it reaches `/callback`.
 */
export async function handleSignIn(request: NextRequest): Promise<Response> {
  const { redirectUri } = getWorkosSettings();
  const url = await getSignInUrl({
    redirectUri,
    returnTo: signInRedirectTarget(request.nextUrl.search),
  });
  return NextResponse.redirect(url);
}

/**
 * Reads the person's default organization from the backend with their new token.
 *
 * This is the same `GET /user/web` the Keycloak sign-in makes, and under WorkOS it is also the
 * call that links the account to its Echno user. A slow or failing backend must not stall the
 * sign-in, so it is bounded and its failure leaves the organization unset.
 */
async function fetchDefaultOrganizationId(
  accessToken: string
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    TOKEN_REFRESH.USER_PROFILE_FETCH_TIMEOUT_MS
  );
  try {
    const res = await fetch(`${process.env.BACKEND_API_URL}/user/web`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn('Failed to fetch user profile on login', {
        status: res.status,
      });
      return undefined;
    }
    const userData = (await res.json()) as {
      defaultOrganizationId?: string | number | null;
    };
    return userData.defaultOrganizationId?.toString();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn(
        'User profile fetch timed out during login; continuing without defaultOrganizationId',
        { timeoutMs: TOKEN_REFRESH.USER_PROFILE_FETCH_TIMEOUT_MS }
      );
    } else {
      logger.error('Error fetching user profile on login', error);
    }
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * `GET /callback`. The library exchanges the code and seals its session cookie; this starts the
 * idle clock beside it, since signing in is the clearest activity there is.
 *
 * `baseURL` is the public origin from the redirect URI, so the redirect after sign-in goes to the
 * host the browser knows rather than to the container's own. A failure lands on `/?error=Callback`,
 * where the landing page explains it, as a failed Keycloak sign-in does.
 */
export async function handleCallback(request: NextRequest): Promise<Response> {
  const { baseUrl, activitySecret, secureCookies } = getWorkosSettings();
  const handler = handleAuth({
    baseURL: baseUrl,
    returnPathname: signInRedirectTarget(''),
    async onSuccess({ accessToken, user }) {
      const { sid } = decodeJwt(accessToken);
      if (typeof sid !== 'string' || sid === '') {
        // Every WorkOS session token carries `sid`. Without it the activity record cannot be tied
        // to the session, and the session would read as ended on the first request anyway.
        throw new Error('WorkOS access token has no session id');
      }
      const org = await fetchDefaultOrganizationId(accessToken);
      const cookieStore = await cookies();
      cookieStore.set(
        ACTIVITY_COOKIE_NAME,
        await sealSessionActivity({ sid, at: Date.now(), org }, activitySecret),
        activityCookieOptions(secureCookies)
      );
      logger.auth.login('workos', { userId: user.id });
    },
    onError() {
      return NextResponse.redirect(new URL('/?error=Callback', baseUrl));
    },
  });
  return handler(request);
}

/** A same-origin path from a form or query value, or `/`. */
function landingPath(value: FormDataEntryValue | null): string {
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
  ) {
    return value;
  }
  return '/';
}

/**
 * `POST /sign-out`, submitted as a form by `signOut()` in `lib/auth/client.tsx`.
 *
 * The library deletes its cookie and redirects to WorkOS's hosted logout, which ends the session
 * there and sends the browser back to `callbackUrl` on this origin. The library redirects by
 * throwing Next's redirect, which a route handler turns into a 307, and a 307 would repeat the
 * POST at WorkOS. It is answered here as a 303 instead, so the browser follows with a GET. The
 * page's `form-action` allows the WorkOS host for that hop (`lib/csp.ts`).
 *
 * A cross-site form cannot sign anyone out: the session cookies are `SameSite=Lax`, so such a
 * POST arrives without them and is only redirected home.
 */
export async function handleSignOut(request: NextRequest): Promise<Response> {
  const { baseUrl } = getWorkosSettings();
  let callbackUrl: FormDataEntryValue | null = null;
  try {
    const form = await request.formData();
    callbackUrl = form.get('callbackUrl');
  } catch {
    callbackUrl = null;
  }
  const returnTo = new URL(landingPath(callbackUrl), baseUrl).toString();

  const cookieStore = await cookies();
  cookieStore.delete({ name: ACTIVITY_COOKIE_NAME, path: '/' });
  try {
    await signOut({ returnTo });
  } catch (error) {
    if (isRedirectError(error)) {
      logger.auth.logout('workos', {});
      return NextResponse.redirect(getURLFromRedirectError(error), 303);
    }
    throw error;
  }
  return NextResponse.redirect(returnTo, 303);
}

/** Whether a state-changing request came from this app's own pages. */
function isSameOrigin(request: NextRequest, baseUrl: string): boolean {
  return request.headers.get('origin') === baseUrl;
}

/**
 * `/api/session`: the session as the browser sees it, in the Auth.js shape.
 *
 * - `GET` reads it, refreshing the access token when due. This is the plain `update()`.
 * - `POST` with `{ activity: true }` is the client saying someone is at the keyboard. The server
 *   stamps its own clock into the activity cookie, as `jwt()` does under Keycloak, and a session
 *   already past its deadline is not revived by it.
 * - `DELETE` ends the session without a navigation: it revokes the WorkOS session and clears both
 *   cookies. The session lifecycle uses it on `/`, where a navigation would cancel a sign-in the
 *   person has just started (`lib/auth/sign-in-flow.ts`).
 *
 * Under `/api`, so the proxy does not run in front of it; it reads the session itself.
 */
export async function handleSessionRequest(
  request: NextRequest
): Promise<Response> {
  const { baseUrl, activitySecret, secureCookies } = getWorkosSettings();

  if (request.method !== 'GET' && !isSameOrigin(request, baseUrl)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { state, authkitHeaders } = await readWorkosRequestSession(
    request,
    'page'
  );
  const responseHeaders = responseHeadersFrom(request, authkitHeaders);

  if (request.method === 'DELETE') {
    const sessionId = state.kind === 'anonymous' ? undefined : state.sessionId;
    if (sessionId) {
      try {
        await getWorkOS().userManagement.revokeSession({ sessionId });
      } catch (error) {
        // The cookies still go. The session then ends at WorkOS on its own inactivity timeout.
        logger.warn('WorkOS session revoke failed', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    }
    const response = NextResponse.json(null);
    applyAuthResponseHeaders(response, responseHeaders);
    response.cookies.set(ACTIVITY_COOKIE_NAME, '', {
      ...activityCookieOptions(secureCookies),
      maxAge: 0,
    });
    response.cookies.set(process.env.WORKOS_COOKIE_NAME || 'wos-session', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      ...(process.env.WORKOS_COOKIE_DOMAIN
        ? { domain: process.env.WORKOS_COOKIE_DOMAIN }
        : {}),
    });
    logger.auth.logout('workos', { hasSessionId: !!sessionId });
    return response;
  }

  if (request.method === 'POST' && state.kind === 'active') {
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }
    if (isActivityAssertion(payload)) {
      const activity = { ...state.activity, at: Date.now() };
      const response = NextResponse.json(
        sessionForState({ ...state, activity })
      );
      applyAuthResponseHeaders(response, responseHeaders);
      response.cookies.set(
        ACTIVITY_COOKIE_NAME,
        await sealSessionActivity(activity, activitySecret),
        activityCookieOptions(secureCookies)
      );
      return response;
    }
  }

  const response = NextResponse.json(sessionForState(state));
  applyAuthResponseHeaders(response, responseHeaders);
  return response;
}
