'use client';

import { useCurrentUserEmployee } from '@/hooks/employee/use-employee';
import { OrgRole } from '@/types/employee';

/**
 * Hook to get the current employee's authorization roles.
 * Sources roles from the employee object (orgRoles)
 * instead of JWT/session data.
 */
export function useEmployeeRoles() {
  const { data: employee, isLoading, error } = useCurrentUserEmployee();

  return {
    orgRoles: (employee?.orgRoles ?? []) as OrgRole[],
    isLoading,
    error,
    employee,
  };
}
