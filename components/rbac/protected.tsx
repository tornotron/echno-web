'use client';

import { useAuthorization } from '@/hooks/use-authorization';
import { ReactNode } from 'react';

interface ProtectedProps {
  /**
   * Role(s) required to view content
   * - Single role: User must have this role
   * - Array of roles: User needs ANY role (OR logic)
   */
  role?: string | string[];

  /**
   * Alternative: User must have ALL specified roles (AND logic)
   */
  allRoles?: string[];

  /**
   * Require system admin access
   */
  requireSystemAdmin?: boolean;

  /**
   * Combination logic when multiple checks are provided
   * If true: User must meet ALL requirements (AND logic)
   * If false: User must meet ANY requirement (OR logic)
   * @default false
   */
  requireAll?: boolean;

  /**
   * Content to show when user has access
   */
  children: ReactNode;

  /**
   * Content to show when user doesn't have access
   * @default null
   */
  fallback?: ReactNode;

  /**
   * Content to show while checking authorization
   * @default null
   */
  loading?: ReactNode;
}

/**
 * Protected component for conditionally rendering based on roles.
 *
 * @example
 * ```tsx
 * <Protected role="SYSTEM_ADMIN">
 *   <AdminPanel />
 * </Protected>
 *
 * <Protected requireSystemAdmin>
 *   <AdminPanel />
 * </Protected>
 *
 * <Protected role={['HR_MANAGER', 'PROJECT_MANAGER']}>
 *   <ManagerControls />
 * </Protected>
 * ```
 */
export function Protected({
  role,
  allRoles,
  requireSystemAdmin = false,
  requireAll = false,
  fallback = null,
  loading = null,
  children,
}: ProtectedProps) {
  const { hasRoles, hasEveryRole, isSystemAdmin, isLoading, isAuthenticated } =
    useAuthorization();

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Not authenticated = no access
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // System admin always has access (unless specifically checking for system admin role)
  if (isSystemAdmin && !requireSystemAdmin) {
    return <>{children}</>;
  }

  // Check system admin requirement
  if (requireSystemAdmin && !isSystemAdmin) {
    return <>{fallback}</>;
  }

  // If only system admin check, and user is system admin, show content
  if (requireSystemAdmin && isSystemAdmin) {
    return <>{children}</>;
  }

  // Collect all access checks
  const accessChecks: boolean[] = [];

  // Check roles
  if (role !== undefined) {
    accessChecks.push(hasRoles(role));
  } else if (allRoles !== undefined) {
    accessChecks.push(hasEveryRole(allRoles));
  }

  // Determine final access
  let hasAccess = false;

  if (accessChecks.length === 0) {
    // No checks specified, allow if authenticated
    hasAccess = true;
  } else if (requireAll) {
    // AND logic: all checks must pass
    hasAccess = accessChecks.every(Boolean);
  } else {
    // OR logic: any check must pass
    hasAccess = accessChecks.some(Boolean);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Require component - shows children only if user is authenticated
 */
export function RequireAuth({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthorization();

  if (isLoading) return <>{fallback}</>;
  if (!isAuthenticated) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * SystemAdminOnly component - shows children only to system admins
 */
export function SystemAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Protected requireSystemAdmin fallback={fallback}>
      {children}
    </Protected>
  );
}
