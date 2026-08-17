import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const isDev = process.env.NODE_ENV !== 'production';

const MARKETING_PATHS = new Set([
  '/',
  '/about',
  '/features',
  '/plans',
  '/contact',
]);

/**
 * Builds a Content-Security-Policy carrying a fresh per-request script nonce.
 * The nonce lets script-src drop 'unsafe-inline': Next.js (and next-themes, via its
 * nonce prop) reads it from the request's content-security-policy header and stamps
 * it onto the inline scripts they emit, so an injected inline <script> without the
 * nonce is blocked. 'unsafe-eval' is kept - some bundled code evaluates strings and
 * eval-based XSS is far rarer than inline injection. No 'strict-dynamic', so host
 * allow-lists still apply ('self' for the chunk files, the Cloudflare host for its
 * beacon). Styles keep 'unsafe-inline' because Next injects inline <style>.
 */
function buildCsp() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCodePoint(...bytes));
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://echno-object-store.blr1.digitaloceanspaces.com https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /api/csp-report',
  ].join('; ');
  return { nonce, policy };
}

/**
 * Auth middleware + Content-Security-Policy.
 *
 * Enforces authentication and session-state routing, and sets the CSP (with the
 * script nonce above) on every document response. Authorization (what a user is
 * allowed to do) is the backend's job and the frontend's role system; this layer
 * only decides which page tree the request belongs in.
 *
 * Flow (top to bottom, first match wins):
 *   1. Session error  → bounce to home with error param.
 *   2. Anonymous on protected route → bounce to home with callback.
 *   3. Authenticated on marketing route (no error param) → forward to dashboard.
 *   4. Otherwise pass through (with the nonce set on the forwarded request so Next
 *      can stamp its scripts).
 *
 * The matcher (below) excludes API routes, so the BFF proxy path is never made to
 * decrypt the session cookie here; it resolves auth itself.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const sessionError = req.auth?.error;
  const hasErrorParam = req.nextUrl.searchParams.has('error');

  const { nonce, policy } = buildCsp();
  const withCsp = (res: NextResponse) => {
    res.headers.set('content-security-policy', policy);
    return res;
  };
  // Pass the request through, forwarding the nonce so Next.js stamps its scripts.
  const passThrough = () => {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('content-security-policy', policy);
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  };

  // 1. Session errors (expired refresh, revoked session) → home with error.
  //    Home itself is allowed through so it can render the error toast.
  if (
    sessionError === 'RefreshAccessTokenError' ||
    sessionError === 'SessionRevoked'
  ) {
    if (pathname === '/') {
      return passThrough();
    }

    const url = new URL('/', req.url);
    url.searchParams.set(
      'error',
      sessionError === 'SessionRevoked' ? 'session_revoked' : 'SessionExpired'
    );
    if (isDev) {
      logger.debug('Middleware: redirecting on session error', {
        pathname,
        error: sessionError,
      });
    }
    return withCsp(NextResponse.redirect(url));
  }

  // 2. Anonymous user trying to reach a protected area → login (home) with callback.
  const isProtected =
    pathname.startsWith('/users/dashboard') || pathname.startsWith('/profile');
  if (!isLoggedIn && isProtected) {
    const url = new URL('/', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return withCsp(NextResponse.redirect(url));
  }

  // 3. Authenticated user on a marketing page → straight to dashboard.
  //    Skip only on `/` when ?error= is present so the home page can show the
  //    toast. Other marketing routes have no toast handler, so a ?error= there
  //    must not bypass the redirect.
  if (
    isLoggedIn &&
    MARKETING_PATHS.has(pathname) &&
    !(pathname === '/' && hasErrorParam)
  ) {
    return withCsp(NextResponse.redirect(new URL('/users/dashboard', req.url)));
  }

  // 4. Pass through.
  return passThrough();
});

/**
 * Matcher: every document request, so the CSP is set app-wide (matching the
 * previous static header). API routes and Next's static assets are excluded -
 * the BFF at `/api/v1/*` resolves auth itself, and decrypting the session cookie
 * for every backend proxy call would add latency to the hottest path. Prefetches
 * are excluded so a cached prefetch response cannot carry a stale nonce.
 */
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
