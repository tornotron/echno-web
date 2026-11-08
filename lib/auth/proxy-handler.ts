import type { NextRequest, NextResponse } from 'next/server';

/**
 * The contract between `proxy.ts` and whichever provider runs in front of it.
 *
 * `proxy.ts` owns the routing and the CSP; the provider owns reading the session and any headers
 * that reading produces. The handler builds its responses through {@link ProxyResponses} so the
 * provider can attach those headers (under WorkOS, a refreshed session cookie) without the
 * routing knowing they exist.
 */

/** What the routing needs to know about the session. */
export interface ProxySession {
  signedIn: boolean;
  /** `RefreshAccessTokenError`, `SessionRevoked` or `SessionIdleTimeout` when the session ended. */
  error?: string;
}

export interface ProxyResponses {
  /** Passes the request on, adding these headers to the forwarded request. */
  next(extraRequestHeaders: Record<string, string>): NextResponse;
  /** Redirects the browser. */
  redirect(url: URL): NextResponse;
}

export type ProxyHandler = (
  request: NextRequest,
  session: ProxySession,
  respond: ProxyResponses
) => NextResponse;
