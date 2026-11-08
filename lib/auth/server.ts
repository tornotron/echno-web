/**
 * The one place server code reaches the sign-in library: route handlers, server components and the
 * proxy use these, never the library itself. An ESLint rule holds the boundary.
 *
 * `getSession` reads the signed-in session, or null. `authProxy` runs the provider in front of the
 * proxy's own routing. `authRouteHandlers` are Auth.js's routes under `/api/auth`, and the
 * `workos*Route` handlers are WorkOS's: each answers 404 under the other provider.
 *
 * The provider is chosen per request from `AUTH_PROVIDER` (`lib/auth/provider.ts`). The WorkOS
 * modules are loaded only when it says `workos`, so a Keycloak stack never runs a line of them.
 */
import type { Session } from 'next-auth';
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from 'next/server';

import { getSessionTokens } from '@/lib/auth/get-session-tokens';
import { auth, handlers } from '@/lib/auth/keycloak/auth';
import { getAuthProvider } from '@/lib/auth/provider';
import type { ProxyHandler } from '@/lib/auth/proxy-handler';

export type {
  ProxyHandler,
  ProxyResponses,
  ProxySession,
} from '@/lib/auth/proxy-handler';

function isWorkos(): boolean {
  return getAuthProvider() === 'workos';
}

function notFound(): NextResponse {
  return new NextResponse('Not Found', { status: 404 });
}

/** The signed-in session, or null. */
export async function getSession(): Promise<Session | null> {
  if (isWorkos()) {
    const { getWorkosSession } = await import('@/lib/auth/workos/session');
    return getWorkosSession();
  }
  return auth();
}

/** The access token the BFF forwards to the backend, or null when there is no usable session. */
export async function getAccessToken(): Promise<string | null> {
  if (isWorkos()) {
    const { getWorkosAccessToken } = await import('@/lib/auth/workos/session');
    return getWorkosAccessToken();
  }
  const tokens = await getSessionTokens();
  return tokens?.accessToken ?? null;
}

/**
 * Wraps the proxy's routing in the provider's session handling.
 *
 * Under Keycloak this is Auth.js's `auth()` wrapper exactly as before: the handler sees
 * `request.auth`, and its responses are plain `NextResponse.next` and `NextResponse.redirect`.
 */
export function authProxy(handler: ProxyHandler) {
  const keycloakProxy = auth((request) =>
    handler(
      request,
      { signedIn: !!request.auth, error: request.auth?.error },
      {
        next(extraRequestHeaders) {
          const requestHeaders = new Headers(request.headers);
          for (const [name, value] of Object.entries(extraRequestHeaders)) {
            requestHeaders.set(name, value);
          }
          return NextResponse.next({ request: { headers: requestHeaders } });
        },
        redirect(url) {
          return NextResponse.redirect(url);
        },
      }
    )
  );

  return async function proxy(request: NextRequest, event: NextFetchEvent) {
    if (isWorkos()) {
      const { runWorkosProxy } = await import('@/lib/auth/workos/proxy');
      return runWorkosProxy(request, handler);
    }
    return keycloakProxy(request, event as never);
  };
}

/** Auth.js's own routes under `/api/auth`. Keycloak only. */
export const authRouteHandlers = {
  GET(request: NextRequest) {
    return isWorkos() ? notFound() : handlers.GET(request);
  },
  POST(request: NextRequest) {
    return isWorkos() ? notFound() : handlers.POST(request);
  },
};

/** `/callback`: WorkOS sends the browser here with the authorization code. */
export async function workosCallbackRoute(
  request: NextRequest
): Promise<Response> {
  if (!isWorkos()) return notFound();
  const { handleCallback } = await import('@/lib/auth/workos/routes');
  return handleCallback(request);
}

/** `/sign-in`: starts a WorkOS sign-in. Also the Initiate login URI set in WorkOS. */
export async function workosSignInRoute(
  request: NextRequest
): Promise<Response> {
  if (!isWorkos()) return notFound();
  const { handleSignIn } = await import('@/lib/auth/workos/routes');
  return handleSignIn(request);
}

/** `POST /sign-out`: ends the session here and at WorkOS. */
export async function workosSignOutRoute(
  request: NextRequest
): Promise<Response> {
  if (!isWorkos()) return notFound();
  const { handleSignOut } = await import('@/lib/auth/workos/routes');
  return handleSignOut(request);
}

/** `/api/session`: the session the browser reads, records activity on, and ends in place. */
export async function workosSessionRoute(
  request: NextRequest
): Promise<Response> {
  if (!isWorkos()) return notFound();
  const { handleSessionRequest } = await import('@/lib/auth/workos/routes');
  return handleSessionRequest(request);
}
