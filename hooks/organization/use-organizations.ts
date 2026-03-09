/**
 * hooks/organization/use-organizations.ts
 *
 * Organization-related query hooks.
 *
 * Provides hooks for retrieving the current user's organizations
 * and a single organization by ID.
 */

import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { shouldRetry } from '@/lib/utils/retry';
import { organizationKeys } from './organization-keys';

/**
 * Hook to fetch all organizations for the current user.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single organization by ID.
 * Includes retry logic for transient errors and caches data for 5 minutes.
 */
export function useOrganization(id: number) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
