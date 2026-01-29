import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { ApiError } from '@/lib/api/api-client';
import { useUser } from '@/hooks/user/use-user';

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
 * Returns the employee data if the user is also an employee.
 * This data is prefetched by UserPrefetcher on login.
 *
 * @returns Employee data if user is an employee, undefined otherwise
 */
export function useCurrentUserEmployee() {
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['employees', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      return employeeService.getById(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - matches employee hook staleTime
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (user is not an employee)
      if (error instanceof ApiError && error.isNotFound) {
        return false;
      }
      return shouldRetry(failureCount, error);
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
