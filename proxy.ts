import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { logger } from '@/lib/logger';

/**
 * proxy middleware
 *
 * HTTP middleware that applies authentication checks to incoming requests.
 * Authorization is handled by the backend API and the frontend employee-based
 * role system — this middleware only enforces authentication.
 *
 * Responsibilities:
 * - Skipping auth for health checks
 * - Handling token-refresh/session errors and revocation
 * - Redirecting unauthenticated users for protected routes
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip auth entirely for health checks to prevent token refresh
  if (pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const hasSessionError =
    req.auth?.error === 'RefreshAccessTokenError' ||
    req.auth?.error === 'SessionRevoked';

  // Log middleware execution
  if (isLoggedIn) {
    logger.debug('Middleware executing for authenticated user', {
      pathname,
      hasSessionId: !!req.auth?.sessionId,
      hasError: !!req.auth?.error,
      error: req.auth?.error,
      timestamp: new Date().toISOString(),
    });
  }

  // ========== TOKEN REFRESH ERROR ==========
  if (hasSessionError) {
    logger.debug('Middleware: Session error detected', {
      error: req.auth?.error,
    });

    if (pathname === '/') {
      logger.debug('Middleware: Allowing home page access for errored session');
      return NextResponse.next();
    }

    const url = new URL('/', req.url);
    url.searchParams.set(
      'error',
      req.auth?.error === 'SessionRevoked'
        ? 'session_revoked'
        : 'SessionExpired'
    );

    logger.debug('Middleware: Redirecting to home due to session error');
    return NextResponse.redirect(url);
  }

  // ========== SESSION REVOCATION CHECK ==========
  if (isLoggedIn && req.auth?.sessionId) {
    logger.debug('Middleware: Checking session revocation', {
      hasSessionId: true,
      pathname,
    });

    if (isSessionRevoked(req.auth.sessionId as string)) {
      logger.warn('Middleware: Session revoked, forcing logout');

      if (pathname === '/') {
        logger.debug('Middleware: Allowing home page for revoked session');
        return NextResponse.next();
      }

      logger.debug('Middleware: Redirecting to home for revoked session');
      return NextResponse.redirect(new URL('/?error=session_revoked', req.url));
    } else {
      logger.debug('Middleware: Session is active (not revoked)');
    }
  } else if (isLoggedIn && !req.auth?.sessionId) {
    logger.debug(
      'Middleware: No sessionId in auth object for revocation check'
    );
  }

  const isProtected =
    pathname.startsWith('/users/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/api/user');

  // ========== AUTHENTICATION CHECK ==========
  if (!isLoggedIn && isProtected) {
    const url = new URL('/', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
