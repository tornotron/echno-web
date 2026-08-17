'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Clears the query cache whenever the session's organization changes.
 *
 * Query keys are not organization-scoped: the tenant travels to the backend in an
 * {@code X-Organization-Id} header the proxy stamps from the session token, not in
 * the cache key. Today the organization is fixed for the life of a session, so a
 * stale entry from another tenant cannot surface. This guard is defence in depth:
 * if a session ever adopts a different organization (e.g. an in-session switch that
 * refreshes the token), every cached entry is dropped so no query serves the
 * previous tenant's rows before it refetches under the new organization.
 */
export function OrgCacheGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const orgId = session?.user?.defaultOrganizationId;
  const previousOrgId = useRef<string | number | null | undefined>(undefined);

  useEffect(() => {
    if (orgId === undefined) return; // organization not established yet

    if (previousOrgId.current === undefined) {
      // First organization seen this mount: record it without clearing.
      previousOrgId.current = orgId;
      return;
    }

    if (previousOrgId.current !== orgId) {
      previousOrgId.current = orgId;
      queryClient.clear();
    }
  }, [orgId, queryClient]);

  return <>{children}</>;
}
