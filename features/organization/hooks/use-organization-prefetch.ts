'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@tornotron/echno-core';
import { organizationService } from '@tornotron/echno-core/organization/services';
import { organizationKeys } from '@tornotron/echno-core/organization/hooks/keys';

/**
 * useOrganizationPrefetch
 *
 * Prefetches the organization summaries for the authenticated user and
 * stores them in the React Query cache under `organizationKeys.summaries()`,
 * the key `useOrganizationSummaries` reads (the picker, the membership check
 * and the breadcrumb lookup). The full list stays lazy: only the
 * organizations card page reads it.
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
        .getAllSummaries()
        .then((organizations) => {
          queryClient.setQueryData(organizationKeys.summaries(), organizations);
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
