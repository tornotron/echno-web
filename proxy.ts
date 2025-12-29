import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { hasPermission, getRolePermissions } from '@/lib/rbac/permissions';
import { Permission } from '@/types/rbac/permission';
import { isSessionRevoked } from '@/lib/auth/session-revocation';
import { isSuperAdmin } from '@/lib/rbac/role-utils';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip auth entirely for health checks to prevent token refresh
  if (pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;

  // Log middleware execution
  if (isLoggedIn) {
    console.log('[Middleware] Executing for authenticated user:', {
      pathname,
      sessionId: req.auth?.sessionId,
      hasError: !!req.auth?.error,
      error: req.auth?.error,
      timestamp: new Date().toISOString(),
    });
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

  // ========== SESSION REVOCATION CHECK ==========
  // Check if session was revoked via backchannel logout
  if (isLoggedIn && req.auth?.sessionId) {
    console.log('[Middleware] Checking session revocation:', {
      sessionId: req.auth.sessionId,
      pathname,
    });

    if (isSessionRevoked(req.auth.sessionId as string)) {
      console.log(
        `[Middleware] Session revoked, forcing logout: ${req.auth.sessionId}`
      );

      // Clear cookies and redirect to login
      const response = NextResponse.redirect(
        new URL('/login?error=session_revoked', req.url)
      );

      // Delete NextAuth cookies
      const cookiesToDelete = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
      ];

      for (const cookie of cookiesToDelete) {
        response.cookies.delete(cookie);
        console.log(`[Middleware] 🗑️ Deleted cookie: ${cookie}`);
      }

      return response;
    } else {
      console.log('[Middleware] Session is active (not revoked)');
    }
  } else if (isLoggedIn && !req.auth?.sessionId) {
    console.log(
      '[Middleware] No sessionId in auth object for revocation check'
    );
  }

  // ========== TOKEN REFRESH ERROR ==========
  // Handle token refresh errors by forcing re-authentication
  if (
    req.auth?.error === 'RefreshAccessTokenError' ||
    req.auth?.error === 'SessionRevoked'
  ) {
    const url = new URL('/login', req.url);
    url.searchParams.set(
      'error',
      req.auth.error === 'SessionRevoked' ? 'session_revoked' : 'SessionExpired'
    );
    url.searchParams.set('callbackUrl', pathname);

    // Create response with cookie cleanup
    const response = NextResponse.redirect(url);

    // Delete all NextAuth cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');

    return response;
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
