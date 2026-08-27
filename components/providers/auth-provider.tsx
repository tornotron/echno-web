'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { OrgCacheGuard } from './org-cache-guard';
import { UserPrefetcher } from './user-prefetcher';
import { useOrganizationPrefetch } from '@/features/organization/hooks/use-organization-prefetch';
import { useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { toast } from '@/lib/styles/toast-styles';
import {
  useSessionLifecycle,
  type SessionNotifier,
} from '@/hooks/use-session-lifecycle';

/**
 * Wires the session lifecycle to the things it needs from the outside world.
 *
 * All the reasoning lives in `useSessionLifecycle`; this holds the session and
 * the two collaborators the hook takes as arguments rather than imports.
 */
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const notify = useMemo<SessionNotifier>(
    () => ({
      error: (message, options) => toast.error(message, options),
      warning: (message, options) => toast.warning(message, options),
      dismiss: (id) => toast.dismiss(id),
    }),
    []
  );

  useSessionLifecycle({
    session,
    status,
    update,
    signOut,
    notify,
  });

  // Sync organization ID header with every session change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.defaultOrganizationId) {
      apiClient.setDefaultHeader(
        'X-Organization-Id',
        String(session.user.defaultOrganizationId)
      );
    }
  }, [status, session?.user?.defaultOrganizationId]);

  return <>{children}</>;
}

/**
 * Runs feature-level prefetch hooks that must execute inside
 * QueryProvider + SessionProvider context.
 */
function FeaturePrefetcher({ children }: { children: React.ReactNode }) {
  useOrganizationPrefetch();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // NextAuth refetches the session whenever a tab becomes visible, which
    // reaches the `jwt()` callback and can exchange the refresh token. That
    // path is invisible to the coordinator every other refresh goes through,
    // and it raced one, which is what revoked a user's session mid-form.
    // `useSessionLifecycle` owns the visibility handling instead, so the
    // refreshes all queue behind each other.
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionMonitor>
        <QueryProvider>
          <OrgCacheGuard>
            <UserPrefetcher>
              <FeaturePrefetcher>{children}</FeaturePrefetcher>
            </UserPrefetcher>
          </OrgCacheGuard>
        </QueryProvider>
      </SessionMonitor>
    </SessionProvider>
  );
}
