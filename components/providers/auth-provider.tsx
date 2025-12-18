'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { QueryProvider } from './query-provider';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/styles/toast-styles';

// Warning thresholds (in minutes before expiration)
const WARNING_TIME = 5; // Show warning 5 minutes before expiration
const FINAL_WARNING_TIME = 1; // Final warning 1 minute before

/**
 * Monitors session for token refresh errors and forces logout
 */
function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggingOut = useRef(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);

  // Handle token refresh errors
  useEffect(() => {
    if (
      status === 'authenticated' && 
      session?.error === 'RefreshAccessTokenError' &&
      !isLoggingOut.current
    ) {
      isLoggingOut.current = true;
      console.warn('Token refresh failed. Forcing logout...');
      toast.error('Session expired. Please login again.');
      signOut({ callbackUrl: '/login' });
    }
  }, [session, status]);

  // Monitor session expiration and show warnings
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    // Only for Keycloak sessions (credentials sessions are long-lived)
    if (session.provider !== 'keycloak') return;

    const checkExpiration = () => {
      // For Keycloak, access tokens typically expire in 5 minutes
      // We'll estimate expiration based on standard Keycloak settings
      const now = Date.now();
      const sessionAge = now - (session as any).lastRefresh || 0;
      const estimatedExpiry = 5 * 60 * 1000; // 5 minutes in ms
      const timeUntilExpiry = estimatedExpiry - sessionAge;

      const minutesRemaining = Math.floor(timeUntilExpiry / 60000);

      // Final warning at 1 minute
      if (minutesRemaining <= FINAL_WARNING_TIME && !hasShownFinalWarning) {
        setHasShownFinalWarning(true);
        toast.warning('Your session will expire in 1 minute', {
          description: 'Any page navigation will refresh your session automatically.',
        });
      }
      // Initial warning at 5 minutes
      else if (minutesRemaining <= WARNING_TIME && !hasShownWarning) {
        setHasShownWarning(true);
        toast.info(`Your session will expire in ${minutesRemaining} minutes`, {
          description: 'Navigate to any page to keep your session active.',
        });
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiration, 60000);
    checkExpiration(); // Check immediately

    return () => clearInterval(interval);
  }, [session, status, hasShownWarning, hasShownFinalWarning]);

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
