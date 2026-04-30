/**
 * components/leave/role-based-wrapper.tsx
 *
 * Higher-order component for conditional rendering based on leave management roles.
 *
 * Usage:
 * ```tsx
 * <RoleBasedWrapper allowedRoles={['manager', 'admin']}>
 *   <ManagerControls />
 * </RoleBasedWrapper>
 *
 * <RoleBasedWrapper
 *   allowedRoles={['admin']}
 *   fallback={<AccessDenied />}
 * >
 *   <AdminPanel />
 * </RoleBasedWrapper>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { LeaveRole } from '@/types/leave';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { AlertCircle } from 'lucide-react';

interface RoleBasedWrapperProps {
  /** Roles allowed to see the content */
  allowedRoles: LeaveRole[];

  /** Content to show if user has allowed role */
  children: ReactNode;

  /** Optional fallback to show if user doesn't have required role */
  fallback?: ReactNode;

  /** If true, shows default "access denied" message when no fallback provided */
  showAccessDenied?: boolean;
}

/**
 * Wrapper component that conditionally renders children based on user's leave role
 */
export function RoleBasedWrapper({
  allowedRoles,
  children,
  fallback,
  showAccessDenied = false,
}: RoleBasedWrapperProps) {
  const { role, isLoading } = useLeaveRole();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Check if user has one of the allowed roles
  const hasAccess = allowedRoles.includes(role);

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don&apos;t have permission to access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  // Default: show nothing
  return null;
}

/**
 * Helper components for specific roles
 */
export function EmployeeOnly({ children }: { children: ReactNode }) {
  return (
    <RoleBasedWrapper
      allowedRoles={[LeaveRole.EMPLOYEE, LeaveRole.MANAGER, LeaveRole.ADMIN]}
    >
      {children}
    </RoleBasedWrapper>
  );
}

export function ManagerOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleBasedWrapper
      allowedRoles={[LeaveRole.MANAGER, LeaveRole.ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleBasedWrapper>
  );
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleBasedWrapper allowedRoles={[LeaveRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  );
}
