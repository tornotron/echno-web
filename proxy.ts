import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { hasResourcePermission } from '@/lib/rbac/resource-permissions';
import { getDashboardForUser } from '@/lib/rbac/role-groups';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { isSystemAdmin } from '@/lib/rbac/role-utils';
import { logger } from '@/lib/logger';

/**
 * proxy middleware
 *
 * HTTP middleware that applies authentication and authorization checks
 * to incoming requests. Responsibilities include:
 * - skipping auth for health checks
 * - handling token-refresh/session errors and revocation
 * - redirecting unauthenticated users for protected routes
 * - enforcing system-admin and resource-based permissions
 *
 * This middleware should be fast and deterministic because it runs on
 * every matched request.
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
  // Handle token refresh errors FIRST (before any other checks)
  // This prevents redirect loops when trying to access home page with an errored session
  if (hasSessionError) {
    logger.debug('Middleware: Session error detected', {
      error: req.auth?.error,
    });

    // Allow access to home page without redirect
    if (pathname === '/') {
      logger.debug('Middleware: Allowing home page access for errored session');
      return NextResponse.next();
    }

    // For other pages, redirect to home with error message
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
  // Check if session was revoked via frontchannel logout
  if (isLoggedIn && req.auth?.sessionId) {
    logger.debug('Middleware: Checking session revocation', {
      hasSessionId: true,
      pathname,
    });

    if (isSessionRevoked(req.auth.sessionId as string)) {
      logger.warn('Middleware: Session revoked, forcing logout');

      // Allow access to home page
      if (pathname === '/') {
        logger.debug('Middleware: Allowing home page for revoked session');
        return NextResponse.next();
      }

      // Redirect to home page
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
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/admin');

  // ========== AUTHENTICATION CHECK ==========
  if (!isLoggedIn && isProtected) {
    // Redirect to home page - user can sign in from there
    const url = new URL('/', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // ========== SYSTEM ADMIN ROUTES ==========
  // Admin routes require system admin access
  if (pathname.startsWith('/admin') && !isSystemAdmin(req.auth?.user.roles)) {
    const url = new URL('/access-denied', req.url);
    url.searchParams.set('path', pathname);
    url.searchParams.set('message', 'System administrator access required');
    return NextResponse.redirect(url);
  }

  // ========== RESOURCE-BASED ROUTE PROTECTION ==========
  // Map routes to required resource permissions (Keycloak Authorization Services)
  // Format: { route: { resource: 'resource-name', scope: 'scope-name' } }
  const routeResourcePermissions: Record<
    string,
    { resource: string; scope: string }
  > = {
    '/users/dashboard/finance': { resource: 'finance', scope: 'read' },
    '/users/dashboard/projects': { resource: 'project', scope: 'read' },
    '/users/dashboard/workforce': { resource: 'employee', scope: 'read' },
    '/users/dashboard/resources': { resource: 'resource', scope: 'read' },
    '/users/dashboard/attendance': { resource: 'attendance', scope: 'read' },
  };

  // Check if user has required resource permission for route
  for (const [route, { resource, scope }] of Object.entries(
    routeResourcePermissions
  )) {
    if (pathname.startsWith(route) && isLoggedIn) {
      const userRoles = req.auth?.user.roles || [];
      const resourcePermissions = req.auth?.user.resourcePermissions || [];
      const userIsSystemAdmin = isSystemAdmin(userRoles);

      // System admin bypasses permission checks
      if (
        !userIsSystemAdmin &&
        !hasResourcePermission(resourcePermissions, resource, scope)
      ) {
        const url = new URL('/access-denied', req.url);
        url.searchParams.set('resource', resource);
        url.searchParams.set('scope', scope);
        url.searchParams.set('path', pathname);
        url.searchParams.set(
          'message',
          `You need ${resource}:${scope} permission to access this page`
        );
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
});

/**
 * Middleware configuration
 *
 * `matcher` controls which paths the middleware runs on. This pattern
 * excludes static assets and Next.js internals while protecting app
 * routes.
 */
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
