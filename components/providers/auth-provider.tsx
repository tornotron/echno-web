'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { useEffect, useRef } from 'react';

/**
 * Monitors session for token refresh errors and forces logout
 */
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    if (
      status === 'authenticated' && 
      session?.error === 'RefreshAccessTokenError' &&
      !isLoggingOut.current
    ) {
      isLoggingOut.current = true;
      console.warn('Token refresh failed. Forcing logout...');
      signOut({ callbackUrl: '/login' });
    }
  }, [session, status]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionMonitor>
        <QueryProvider>{children}</QueryProvider>
      </SessionMonitor>
    </SessionProvider>
  );
}
