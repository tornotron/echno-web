/**
 * hooks/user/use-user.ts
 *
 * User-centric query hooks for current user profile and related collections.
 *
 * - `useUser()` fetches the current authenticated user's profile and applies
 *   enterprise-friendly caching and retry rules.
 * - `useUserEmployees()` returns employee profiles associated with the
 *   current user.
 *
 * Implementation notes: parsing and normalization are handled in the
 * `userService`. Hooks are intentionally thin and focus on attaching
 * configuration (staleTime, gcTime, retry) and consumer-friendly signatures.
 */

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { ApiError } from '@/lib/api/api-client';

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
 * Hook to fetch the current authenticated user's profile.
 * Includes retry logic for transient errors.
 *
 * The user data includes attachments array which contains profile picture,
 * CV, and other user-related files. Use user.profilePicture and user.cv
 * for convenient access to these specific attachments.
 *
 * Data is prefetched on login by UserPrefetcher and cached for 10 minutes.
 * This means navigating to profile page won't trigger a new fetch if
 * the cached data is still fresh.
 *
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useUser();
 *
 * // Access profile picture (extracted from attachments)
 * if (user?.profilePicture) {
 *   console.log(user.profilePicture.file);
 * }
 *
 * // Access CV (extracted from attachments)
 * if (user?.cv) {
 *   console.log(user.cv.fileName);
 * }
 *
 * // Or access all attachments
 * if (user?.attachments) {
 *   console.log(user.attachments);
 * }
 * ```
 */
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches prefetch staleTime
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch all employee profiles for the current user.
 * Returns a list of employee objects across all organizations the user belongs to.
 * The current/active employee is where defaultOrganizationId = employee.organizationId.
 *
 * @example
 * ```tsx
 * const { data: user } = useUser();
 * const { data: employees, isLoading } = useUserEmployees();
 *
 * // Find current employee
 * const currentEmployee = employees?.find(
 *   emp => emp.organizationId === user?.defaultOrganizationId
 * );
 * ```
 */
export function useUserEmployees() {
  return useQuery({
    queryKey: ['user', 'employees'],
    queryFn: () => userService.getUserEmployees(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
