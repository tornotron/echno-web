'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@tornotron/echno-core';
import { moduleService } from '@tornotron/echno-core/module/services';
import { moduleKeys } from '@tornotron/echno-core/module/hooks/keys';

/**
 * useModulesPrefetch
 *
 * Prefetches the enabled-module set for the authenticated user and stores it
 * in the React Query cache under `moduleKeys.enabled()`. Cloned from
 * `features/organization/hooks/use-organization-prefetch.ts`.
 *
 * A rejected fetch (the endpoint 404ing before `tornotron/echno-backend#747`
 * ships, or a genuine outage) is swallowed here exactly as the organization
 * prefetch swallows its own: nothing is written to the cache, so the first
 * component that mounts `useEnabledModuleIds()` fetches on its own and lands
 * in the same documented "no gating" fallback.
 *
 * Mount this hook once at the app level, alongside `useOrganizationPrefetch`.
 */
export function useModulesPrefetch() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !hasPrefetched.current) {
      hasPrefetched.current = true;

      moduleService
        .listEnabled()
        .then((modules) => {
          queryClient.setQueryData(moduleKeys.enabled(), modules);
          logger.debug('Enabled modules prefetched successfully');
        })
        .catch((error) => {
          logger.error('Failed to prefetch enabled modules:', error);
          hasPrefetched.current = false;
        });
    }

    if (status === 'unauthenticated') {
      hasPrefetched.current = false;
    }
  }, [status, queryClient]);
}
