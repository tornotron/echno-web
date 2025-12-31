import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { hasPermission, getRolePermissions } from '@/lib/rbac/permissions';
import { Permission } from '@/types/rbac/permission';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { isSuperAdmin } from '@/lib/rbac/role-utils';
import { logger } from '@/lib/logger';
import { deleteNextAuthCookies } from '@/lib/auth/cookie-utils';

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
  // This prevents redirect loops when trying to access /login with an errored session
  if (hasSessionError) {
    logger.debug('Middleware: Session error detected', {
      error: req.auth?.error,
    });

    // Allow access to login page without redirect
    if (pathname === '/login') {
      // Create response that clears cookies but allows login page access
      const response = deleteNextAuthCookies(NextResponse.next());

      logger.debug(
        'Middleware: Cleared session cookies, allowing login page access'
      );
      return response;
    }

    // For other pages, redirect to login with error message
    const url = new URL('/login', req.url);
    url.searchParams.set(
      'error',
      req.auth?.error === 'SessionRevoked'
        ? 'session_revoked'
        : 'SessionExpired'
    );
    if (pathname !== '/') {
      url.searchParams.set('callbackUrl', pathname);
    }

    // Create response with cookie cleanup
    const response = deleteNextAuthCookies(NextResponse.redirect(url));

    logger.debug('Middleware: Redirecting to login due to session error');
    return response;
  }

  // ========== SESSION REVOCATION CHECK ==========
  // Check if session was revoked via backchannel logout
  if (isLoggedIn && req.auth?.sessionId) {
    logger.debug('Middleware: Checking session revocation', {
      hasSessionId: true,
      pathname,
    });

    if (isSessionRevoked(req.auth.sessionId as string)) {
      logger.warn('Middleware: Session revoked, forcing logout');

      // Allow access to login page
      if (pathname === '/login') {
        const response = deleteNextAuthCookies(NextResponse.next());
        logger.debug('Middleware: Cleared cookies for revoked session');
        return response;
      }

      // Clear cookies and redirect to login
      const response = deleteNextAuthCookies(
        NextResponse.redirect(new URL('/login?error=session_revoked', req.url))
      );

      logger.debug('Middleware: Redirecting to login for revoked session');
      return response;
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
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/users/dashboard', req.url));
  }

  // ========== SUPER ADMIN ROUTES ==========
  // Admin routes require super admin access
  if (pathname.startsWith('/admin') && !isSuperAdmin(req.auth?.user.roles)) {
    const url = new URL('/users/dashboard', req.url);
    url.searchParams.set('error', 'forbidden');
    url.searchParams.set('message', 'Super admin access required');
    return NextResponse.redirect(url);
  }

  // ========== PERMISSION-BASED ROUTE PROTECTION ==========
  // Map routes to required permissions
  const routePermissions: Record<string, Permission> = {
    '/users/dashboard/finance': Permission.FINANCE_VIEW,
    '/users/dashboard/projects': Permission.PROJECT_VIEW,
    '/users/dashboard/workforce': Permission.WORKFORCE_VIEW,
    '/users/dashboard/resources': Permission.RESOURCE_VIEW,
    '/users/dashboard/inspections': Permission.INSPECTION_VIEW,
  };

  // Check if user has required permission for route
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route) && isLoggedIn) {
      const userRoles = req.auth?.user.roles || [];
      const userPermissions = getRolePermissions(userRoles);
      const userIsSuperAdmin = isSuperAdmin(userRoles);

      // Super admin bypasses permission checks
      if (!userIsSuperAdmin && !hasPermission(userPermissions, permission)) {
        const url = new URL('/users/dashboard', req.url);
        url.searchParams.set('error', 'insufficient_permissions');
        url.searchParams.set('required', permission);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
