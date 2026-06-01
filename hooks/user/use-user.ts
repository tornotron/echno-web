/**
 * hooks/user/use-user.ts
 *
 * User-centric query hooks for current user profile and related collections.
 *
 * - `useUser()` fetches the current authenticated user's profile.
 * - `useUserEmployees()` returns employee profiles associated with the
 *   current user.
 *
 * Implementation notes: parsing and normalization are handled in the
 * `userService`. These hooks attach the appropriate option profile from
 * `lib/query/options.ts` and the shared retry policy.
 */

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { shouldRetry } from '@/lib/query/retry';
import { standardQueryOptions } from '@/lib/query/options';
import { userKeys } from './user-keys';

/**
 * Hook to fetch the current authenticated user's profile.
 *
 * Uses the `standardQueryOptions` profile (staleTime 60 s, gcTime 5 min,
 * `refetchOnWindowFocus` in production only). The user is prefetched on
 * login by `UserPrefetcher`; this hook hits cache for the first observation.
 *
 * The user data includes an `attachments` array containing profile picture,
 * CV, and other user-related files. Use `user.profilePicture` and `user.cv`
 * for convenient access to derived references.
 */
export function useUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => userService.getCurrentUser(),
    ...standardQueryOptions,
    retry: shouldRetry,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch all employee profiles for the current user.
 * Returns a list of employee objects across all organizations the user
 * belongs to. The current/active employee matches `defaultOrganizationId`.
 */
export function useUserEmployees() {
  return useQuery({
    queryKey: userKeys.employees(),
    queryFn: () => userService.getUserEmployees(),
    ...standardQueryOptions,
    retry: shouldRetry,
  });
}
