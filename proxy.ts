import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { storageOrigins } from '@/lib/storage-origins';

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
 * nonce is blocked. script-src allows 'wasm-unsafe-eval' but not 'unsafe-eval', so
 * string eval / the Function constructor stay blocked (the XSS surface) while
 * WebAssembly can still compile: the shipped bundle has no reachable string eval - the
 * Function("return this") fallbacks are dead in a browser where self is defined, and
 * the Turbopack runtime's WASM loader is the only live eval-class API. No
 * 'strict-dynamic', so host allow-lists still apply ('self' for the chunk files, the
 * Cloudflare host for its beacon). Styles keep 'unsafe-inline' because Next injects
 * inline <style>.
 */
/**
 * Object-storage origins the browser is allowed to `PUT` to for direct-to-
 * storage attachment uploads (presigned flow), and to read those attachments
 * back from. Defined once in `lib/storage-origins.ts`, which `next.config.ts`
 * reads too so the CSP and `next/image`'s remote patterns cannot name
 * different stores.
 *
 * An empty list is a broken deployment, not a safe default: with no storage
 * origin the browser blocks the presigned `PUT` before it is sent, and the
 * user is told the file failed to upload with nothing recorded anywhere. It
 * has shipped that way once already, so a production build without the
 * variable now says so in the log.
 */
function configuredStorageOrigins(): string[] {
  const origins = storageOrigins();
  if (origins.length === 0) warnOnceAboutMissingStorageOrigin();
  return origins;
}

let storageOriginWarned = false;

/**
 * Reports the missing storage origin the first time a CSP is built, rather
 * than on every request. Silent in development, where attachment uploads are
 * not expected to reach a real object store.
 */
function warnOnceAboutMissingStorageOrigin(): void {
  if (isDev || storageOriginWarned) return;
  storageOriginWarned = true;
  logger.error(
    'NEXT_PUBLIC_STORAGE_ORIGIN is not set; the CSP will block direct-to-storage attachment uploads',
    undefined,
    { expected: 'the origin the backend signs upload URLs against' }
  );
}

function buildCsp() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCodePoint(...bytes));
  // The direct PUT to object storage is a cross-origin request from the
  // browser, so each storage origin must be allow-listed in connect-src (the
  // signed url carries its own auth; CORS on the bucket is the other half).
  const storage = configuredStorageOrigins();
  const connectSrc = [
    "'self'",
    'https://cloudflareinsights.com',
    ...storage,
  ].join(' ');
  // The same origins again: an attachment is uploaded through connect-src and
  // then rendered through img-src, so a store listed for one and not the other
  // stores files that can never be displayed. They are built from one list for
  // that reason.
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    ...storage,
    'https://images.unsplash.com',
  ].join(' ');
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
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

  // 1. Session errors (expired refresh, revoked session, idle past the
  //    deadline) → home with error. Home itself is allowed through so it can
  //    render the error toast. The idle case reuses the SessionExpired param
  //    rather than adding a third: it is the same ending to the user, and the
  //    distinction only matters in the logs.
  if (
    sessionError === 'RefreshAccessTokenError' ||
    sessionError === 'SessionRevoked' ||
    sessionError === 'SessionIdleTimeout'
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
