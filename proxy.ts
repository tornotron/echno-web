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
 * Auth middleware
 *
 * Enforces authentication and session-state routing. Authorization (what a
 * user is allowed to do) is the backend's job and the frontend's role system;
 * this layer only decides which page tree the request belongs in.
 *
 * Flow (top to bottom, first match wins):
 *   1. Session error  → bounce to home with error param.
 *   2. Anonymous on protected route → bounce to home with callback.
 *   3. Authenticated on marketing route (no error param) → forward to dashboard.
 *   4. Otherwise pass through.
 *
 * Session revocation is detected by the JWT callback in `auth.ts`, which
 * stamps `req.auth.error = 'SessionRevoked'`. We do not re-check the
 * revocation store here — single source of truth.
 *
 * The matcher (below) intentionally excludes API routes; each API route is
 * responsible for its own auth handling. This avoids decrypting the JWT
 * cookie on every backend proxy call inside the middleware layer.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const sessionError = req.auth?.error;
  const hasErrorParam = req.nextUrl.searchParams.has('error');

  // 1. Session errors (expired refresh, revoked session) → home with error.
  //    Home itself is allowed through so it can render the error toast.
  if (
    sessionError === 'RefreshAccessTokenError' ||
    sessionError === 'SessionRevoked'
  ) {
    if (pathname === '/') {
      return NextResponse.next();
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
    return NextResponse.redirect(url);
  }

  // 2. Anonymous user trying to reach a protected area → login (home) with callback.
  const isProtected =
    pathname.startsWith('/users/dashboard') || pathname.startsWith('/profile');
  if (!isLoggedIn && isProtected) {
    const url = new URL('/', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 3. Authenticated user on a marketing page → straight to dashboard.
  //    Skip when ?error= is present so the home page can show the toast first.
  if (isLoggedIn && MARKETING_PATHS.has(pathname) && !hasErrorParam) {
    return NextResponse.redirect(new URL('/users/dashboard', req.url));
  }

  return NextResponse.next();
});

/**
 * Matcher: only the pages this middleware actually needs to gate.
 *
 * We deliberately omit `/api/*` — API routes resolve auth themselves where
 * needed (e.g. the BFF at `/api/v1/*` calls `getSessionTokens`). Decrypting
 * the JWT cookie inside middleware for every backend proxy call is wasted
 * work and adds latency to the hottest path in the app.
 */
export const config = {
  matcher: [
    '/',
    '/about',
    '/features',
    '/plans',
    '/contact',
    '/users/dashboard/:path*',
    '/profile/:path*',
  ],
};
