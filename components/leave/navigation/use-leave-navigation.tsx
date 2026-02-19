'use client';

import { useMemo } from 'react';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { usePendingApprovalsCount } from '@/hooks/leave/use-leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { getRoleBasedNavigationItems } from './leave-navigation-items';

/**
 * Hook to get leave navigation items for current user
 */
export function useLeaveNavigation() {
  const { role, isLoading: roleLoading } = useLeaveRole();
  const { data: employee } = useCurrentUserEmployee();
  const { data: pendingCount } = usePendingApprovalsCount(employee?.id || 0);

  const navItems = useMemo(() => {
    if (roleLoading) return [];
    return getRoleBasedNavigationItems(role, pendingCount);
  }, [role, pendingCount, roleLoading]);

  return {
    items: navItems,
    pendingCount,
    isLoading: roleLoading,
  };
}
