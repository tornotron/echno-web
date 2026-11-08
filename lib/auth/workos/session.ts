import {
  authkit,
  partitionAuthkitHeaders,
  withAuth,
} from '@workos-inc/authkit-nextjs';
import type { Session } from 'next-auth';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import {
  ACTIVITY_COOKIE_NAME,
  type SessionActivity,
  isActivityExpired,
  readSessionActivity,
} from '@/lib/auth/workos/activity-cookie';
import { getWorkosSettings } from '@/lib/auth/workos/settings';

/**
 * Reading the WorkOS session, for the three places that need it: the proxy (pages), the BFF and
 * the session endpoint the browser polls.
 *
 * Pages could use `withAuth()`, because the proxy runs `authkit` in front of them and leaves the
 * session on the request headers. Routes under `/api` cannot: the proxy's matcher leaves them out,
 * and has to, because Next buffers the body of every request a proxy sees and caps it at 10 MB,
 * which would break large uploads through the BFF under either provider. Those routes call
 * `authkit(request)` themselves, which is the same read and refresh `withAuth()` sits on.
 */

/** Where the library keeps its sealed session. */
function sessionCookieName(): string {
  return process.env.WORKOS_COOKIE_NAME || 'wos-session';
}

/** The verdict on one request. */
export type WorkosSessionState =
  /** No session cookie at all: an ordinary anonymous request. */
  | { kind: 'anonymous' }
  /**
   * A session cookie that cannot be used. `idle` when the activity rule ended it (idle past the
   * deadline, or no valid activity record for this session), `refresh` when WorkOS no longer
   * honours it.
   */
  | {
      kind: 'ended';
      reason: 'idle' | 'refresh';
      /** The session id, from the activity record when the library was not asked. */
      sessionId?: string;
      user?: WorkosUser;
    }
  | {
      kind: 'active';
      sessionId: string;
      accessToken: string;
      user: WorkosUser;
      activity: SessionActivity;
    };

/** The parts of a WorkOS user the app reads. */
export interface WorkosUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface WorkosRequestSession {
  state: WorkosSessionState;
  /**
   * What `authkit` produced: its internal request headers (for `withAuth()` further down) and any
   * `Set-Cookie` from a refresh. Use {@link responseHeadersFrom} or `partitionAuthkitHeaders` to
   * split them; never copy them onto a response wholesale.
   */
  authkitHeaders: Headers;
}

/**
 * The library starts a PKCE flow for every anonymous document request and appends its verifier
 * cookie, expecting the proxy to redirect to AuthKit. This app sends people to `/` instead, as it
 * does under Keycloak, and starts the flow from `/sign-in`, so those cookies would only pile up.
 */
function withoutPkceCookies(headers: Headers): Headers {
  const result = new Headers(headers);
  const setCookies = result.getSetCookie();
  result.delete('set-cookie');
  for (const cookie of setCookies) {
    if (!cookie.startsWith('wos-auth-verifier')) {
      result.append('set-cookie', cookie);
    }
  }
  return result;
}

/**
 * The headers `authkit` sets when it finds no session, which is what lets `withAuth()` further
 * down answer "nobody" instead of throwing that the proxy did not run.
 */
function emptySessionHeaders(request: NextRequest, redirectUri: string) {
  return new Headers({
    'x-workos-middleware': 'true',
    'x-url': request.url,
    'x-redirect-uri': redirectUri,
  });
}

/**
 * Reads and, where due, refreshes the session on `request`, then applies the idle rule.
 *
 * A session whose activity record is already past the deadline is answered without asking the
 * library, so it is not refreshed. Every refresh resets WorkOS's own inactivity timer, and a
 * replayed cookie that kept being refreshed here would hold that timer off forever.
 *
 * @param deadline - `page` or `bff`; see `isActivityExpired`.
 */
export async function readWorkosRequestSession(
  request: NextRequest,
  deadline: 'page' | 'bff'
): Promise<WorkosRequestSession> {
  const { redirectUri, activitySecret } = getWorkosSettings();
  const now = Date.now();

  if (!request.cookies.has(sessionCookieName())) {
    return {
      state: { kind: 'anonymous' },
      authkitHeaders: emptySessionHeaders(request, redirectUri),
    };
  }

  const activity = await readSessionActivity(
    request.cookies.get(ACTIVITY_COOKIE_NAME)?.value,
    activitySecret
  );
  if (activity && isActivityExpired(activity, activity.sid, now, deadline)) {
    return {
      state: { kind: 'ended', reason: 'idle', sessionId: activity.sid },
      authkitHeaders: emptySessionHeaders(request, redirectUri),
    };
  }

  const { session, headers } = await authkit(request, { redirectUri });
  const authkitHeaders = withoutPkceCookies(headers);

  if (!session.user || !session.accessToken || !session.sessionId) {
    return {
      state: { kind: 'ended', reason: 'refresh', sessionId: activity?.sid },
      authkitHeaders,
    };
  }

  if (
    !activity ||
    isActivityExpired(activity, session.sessionId, now, deadline)
  ) {
    return {
      state: {
        kind: 'ended',
        reason: 'idle',
        sessionId: session.sessionId,
        user: session.user,
      },
      authkitHeaders,
    };
  }

  return {
    state: {
      kind: 'active',
      sessionId: session.sessionId,
      accessToken: session.accessToken,
      user: session.user,
      activity,
    },
    authkitHeaders,
  };
}

/** The headers from {@link readWorkosRequestSession} that belong on the response to the browser. */
export function responseHeadersFrom(
  request: NextRequest,
  authkitHeaders: Headers
): Headers {
  return partitionAuthkitHeaders(request, authkitHeaders).responseHeaders;
}

/** The error a session carries, in the same words the Keycloak session uses. */
export function sessionError(
  state: WorkosSessionState
): 'SessionIdleTimeout' | 'RefreshAccessTokenError' | undefined {
  if (state.kind !== 'ended') return undefined;
  return state.reason === 'idle'
    ? 'SessionIdleTimeout'
    : 'RefreshAccessTokenError';
}

/**
 * The session in the shape the rest of the app already reads (the Auth.js `Session`), so pages,
 * hooks and the session lifecycle need no second code path.
 */
export function toAuthSession(
  user: WorkosUser | undefined,
  sessionId: string | undefined,
  activity: SessionActivity | null | undefined,
  error?: string
): Session {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const expiresAt =
    (activity?.at ?? Date.now()) + SESSION_ACTIVITY.IDLE_SIGN_OUT_MS;
  return {
    user: {
      id: user?.id ?? '',
      email: user?.email ?? '',
      name,
      defaultOrganizationId: activity?.org ?? '',
    },
    provider: 'workos',
    sessionId,
    expires: new Date(expiresAt).toISOString(),
    ...(error ? { error } : {}),
  };
}

/** The client-facing session for a request verdict, or null when nobody is signed in. */
export function sessionForState(state: WorkosSessionState): Session | null {
  switch (state.kind) {
    case 'anonymous': {
      return null;
    }
    case 'ended': {
      return toAuthSession(
        state.user,
        state.sessionId,
        null,
        sessionError(state)
      );
    }
    case 'active': {
      return toAuthSession(state.user, state.sessionId, state.activity);
    }
  }
}

/**
 * The signed-in session for a server component or route under the proxy, or null.
 * Uses `withAuth()`, which reads what the proxy's `authkit` call left on the request.
 */
export async function getWorkosSession(): Promise<Session | null> {
  const { activitySecret } = getWorkosSettings();
  const auth = await withAuth();
  if (!auth.user) return null;

  const cookieStore = await cookies();
  const activity = await readSessionActivity(
    cookieStore.get(ACTIVITY_COOKIE_NAME)?.value,
    activitySecret
  );
  const expired = isActivityExpired(
    activity,
    auth.sessionId,
    Date.now(),
    'page'
  );
  return toAuthSession(
    auth.user,
    auth.sessionId,
    activity,
    expired ? 'SessionIdleTimeout' : undefined
  );
}

/** The access token for a server component or route under the proxy, or null. */
export async function getWorkosAccessToken(): Promise<string | null> {
  const session = await getWorkosSession();
  if (!session || session.error) return null;
  const { accessToken } = await withAuth();
  return accessToken ?? null;
}
