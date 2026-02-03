/**
 * hooks/invitation/use-invitation.ts
 *
 * Query hooks for fetching and validating invitation data.
 *
 * Exports:
 * - `useInvitationsByOrganization(organizationId?)` — query listing invitations
 * - `useValidateInviteCode(userId?, inviteCode?, enabled?)` — one-off validation
 *
 * These hooks follow React Query idioms for `staleTime`, `retry` and
 * `retryDelay`, and provide robust retry logic tailored to HTTP error
 * semantics (no retry for client errors except timeout and rate-limit).
 */

import { useQuery } from '@tanstack/react-query';
import { invitationService } from '@/services/invitation-service';
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
 * Hook to fetch invitations by organization ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 *
 * @param organizationId - Organization ID to fetch invitations for
 * @returns React Query result with invitations data
 *
 * @example
 * ```tsx
 * const { data: invitations, isLoading } = useInvitationsByOrganization(orgId);
 * ```
 */
export function useInvitationsByOrganization(organizationId?: number) {
  return useQuery({
    queryKey: ['invitations', 'organization', organizationId],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      return invitationService.getByOrganization(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to validate an invite code.
 * Does not cache results as validation should be fresh each time.
 *
 * @param userId - User ID to validate the code for
 * @param inviteCode - Invite code to validate
 * @param enabled - Whether to enable the query (default: true if code and userId are provided)
 * @returns React Query result with validation response
 *
 * @example
 * ```tsx
 * const { data: validation, isLoading } = useValidateInviteCode(userId, code);
 * if (validation?.valid) {
 *   // Code is valid, show invitation details
 * }
 * ```
 */
export function useValidateInviteCode(
  userId?: number,
  inviteCode?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['invitations', 'validate', userId, inviteCode],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!inviteCode) {
        throw new Error('Invite code is required');
      }
      return invitationService.validateCode(userId, inviteCode);
    },
    enabled: enabled && !!userId && !!inviteCode,
    staleTime: 0, // Don't cache validation results
    gcTime: 0, // Don't keep in cache
    retry: false, // Don't retry validation failures
  });
}
