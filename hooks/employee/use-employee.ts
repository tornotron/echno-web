import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { ApiError } from '@/lib/api/api-client';
import { useUser, useUserEmployees } from '@/hooks/user/use-user';
import { useMemo } from 'react';

/**
 * Determine if an error should trigger a retry.
 * We don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit).
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 3) return false;

  if (error instanceof ApiError) {
    // Don't retry auth errors or not found
    if (error.isAuthError || error.isNotFound) return false;
    // Retry server errors, timeouts, and network errors
    if (error.isServerError || error.isTimeout || error.status === 0)
      return true;
    // Retry rate limiting
    if (error.status === 429) return true;
    // Don't retry other client errors
    if (error.status >= 400 && error.status < 500) return false;
  }

  // Default: retry network errors
  return true;
}

/**
 * Hook to fetch all employees.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single employee by ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useEmployee(id: number) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch employees by organization ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useEmployeesByOrganization(organizationId: number) {
  return useQuery({
    queryKey: ['employees', 'organization', organizationId],
    queryFn: () => employeeService.getByOrganization(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to get the current user's employee profile.
 * Returns the employee data for the user's currently selected organization.
 * This data is prefetched by UserPrefetcher on login.
 *
 * The hook derives the current employee from all user employees by matching
 * the user's defaultOrganizationId with the employee's organizationId.
 *
 * @returns Employee data if user is an employee in the current organization, undefined otherwise
 *
 * @example
 * ```tsx
 * const { data: employee, isLoading } = useCurrentUserEmployee();
 *
 * // employee will be the one matching user.defaultOrganizationId
 * if (employee) {
 *   console.log(`Current employee in org ${employee.organizationId}`);
 * }
 * ```
 */
export function useCurrentUserEmployee() {
  const { data: user } = useUser();
  const { data: employees, isLoading, error } = useUserEmployees();

  const defaultOrgId = user?.defaultOrganizationId;

  // Derive current employee from the list based on defaultOrganizationId
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
 * Includes retry logic for transient errors and caches data for 5 minutes.
 *
 * @param managerId - Employee ID of the manager
 * @returns Array of employees reporting to this manager
 */
export function useSubordinates(managerId?: number) {
  return useQuery({
    queryKey: ['employees', 'subordinates', managerId],
    queryFn: () => {
      if (!managerId) {
        throw new Error('Manager ID is required');
      }
      return employeeService.getSubordinates(managerId);
    },
    enabled: !!managerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch all managers in an organization.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 *
 * @param organizationId - Organization ID
 * @returns Array of employees who are managers
 */
export function useManagers(organizationId?: number) {
  return useQuery({
    queryKey: ['employees', 'managers', organizationId],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      return employeeService.getManagers(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
