import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { useUser, useUserEmployees } from '@/hooks/user/use-user';
import { useMemo } from 'react';
import { shouldRetry } from '@/lib/query/retry';
import { standardQueryOptions } from '@/lib/query/options';
import { employeeKeys } from './employee-keys';

/**
 * Hook to fetch all employees.
 */
export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: () => employeeService.getAll(),
    ...standardQueryOptions,
    retry: shouldRetry,
  });
}

/**
 * Hook to fetch a single employee by ID.
 */
export function useEmployee(id: number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
    ...standardQueryOptions,
    retry: shouldRetry,
  });
}

/**
 * Hook to get the current user's employee profile.
 * Returns the employee data for the user's currently selected organization.
 * Prefetched by UserPrefetcher on login.
 *
 * Derives the current employee from the user's employee list by matching
 * `defaultOrganizationId` with `employee.organizationId`.
 */
export function useCurrentUserEmployee() {
  const { data: user } = useUser();
  const { data: employees, isLoading, error } = useUserEmployees();

  const defaultOrgId = user?.defaultOrganizationId;

  const currentEmployee = useMemo(() => {
    if (!defaultOrgId || !employees) {
      return;
    }
    return employees.find((emp) => emp.organizationId === defaultOrgId);
  }, [defaultOrgId, employees]);

  return {
    data: currentEmployee,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch all subordinates (direct reports) of a manager.
 */
export function useSubordinates(managerId?: number) {
  return useQuery({
    queryKey: employeeKeys.subordinates(managerId),
    queryFn: () => {
      if (!managerId) {
        throw new Error('Manager ID is required');
      }
      return employeeService.getSubordinates(managerId);
    },
    enabled: !!managerId,
    ...standardQueryOptions,
    retry: shouldRetry,
  });
}

/**
 * Hook to fetch all managers in the current organization.
 */
export function useManagers() {
  return useQuery({
    queryKey: employeeKeys.managers(),
    queryFn: () => employeeService.getManagers(),
    ...standardQueryOptions,
    retry: shouldRetry,
  });
}
