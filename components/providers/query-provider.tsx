'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { shouldRetry } from '@/lib/query/retry';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 60 s; avoids redundant background refetches
            // on rapid navigation between pages that share the same query.
            staleTime: 60 * 1000,
            // Keep unused cache entries for 5 min before garbage-collecting them.
            // Allows instant cache-hits when navigating back within the same session.
            gcTime: 5 * 60 * 1000,
            // Delegate retry logic to the shared policy: retries 5xx/network/429,
            // skips retries on 4xx client errors and auth failures.
            retry: shouldRetry,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
            // Refetch on window focus only in production; avoids noise during dev
            // where devtools / editor switches constantly trigger refetches.
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Always reconnect-refetch so stale data is corrected after a network drop.
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
