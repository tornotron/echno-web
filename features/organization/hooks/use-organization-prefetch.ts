'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';
import { organizationKeys } from '@/hooks/organization/organization-keys';
import { logger } from '@/lib/logger';

/**
 * useOrganizationPrefetch
 *
 * Prefetches organizations for the authenticated user and stores
 * them in the React Query cache under `organizationKeys.all`.
 *
 * Mount this hook once at the app level (e.g., inside AuthProvider or
 * a dedicated provider) alongside `<UserPrefetcher>`.
 *
 * Usage:
 * ```tsx
 * function AppProviders({ children }: { children: React.ReactNode }) {
 *   useOrganizationPrefetch();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useOrganizationPrefetch() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !hasPrefetched.current) {
      hasPrefetched.current = true;

      organizationService
        .getAll()
        .then((organizations) => {
          queryClient.setQueryData(organizationKeys.all, organizations);
          logger.debug('User organizations prefetched successfully');
        })
        .catch((error) => {
          logger.error('Failed to prefetch user organizations:', error);
          hasPrefetched.current = false;
        });
    }

    if (status === 'unauthenticated') {
      hasPrefetched.current = false;
    }
  }, [status, queryClient]);
}
