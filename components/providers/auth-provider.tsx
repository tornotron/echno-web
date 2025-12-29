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

  // Handle token refresh errors and session revocation
  useEffect(() => {
    if (status === 'authenticated' && session?.error && !isLoggingOut.current) {
      isLoggingOut.current = true;

      if (session.error === 'RefreshAccessTokenError') {
        console.warn('[Session] Token refresh failed. Forcing logout...');
        toast.error('Session expired. Please login again.');
      } else if (session.error === 'SessionRevoked') {
        console.warn('[Session] Session revoked. Forcing logout...');
        toast.error('Your session was terminated. Please login again.');
      }

      // Force logout with cookie cleanup
      signOut({ callbackUrl: '/login?error=session_expired' });
    }
  }, [session, status]);

  // Monitor session expiration and show warnings
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    // Only for Keycloak sessions (credentials sessions are long-lived)
    if (session.provider !== 'keycloak') return;

    // ✅ FIXED: Use actual expiresAt from session
    const expiresAt = session.expiresAt;
    if (!expiresAt) return; // No expiration time available

    const checkExpiration = () => {
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const minutesRemaining = Math.floor(timeUntilExpiry / 60_000);

      // Session already expired
      if (timeUntilExpiry <= 0) {
        return;
      }

      // Final warning at 1 minute
      if (minutesRemaining <= FINAL_WARNING_TIME && !hasShownFinalWarning) {
        setHasShownFinalWarning(true);
        toast.warning('Your session will expire in 1 minute', {
          description:
            'Any page navigation will refresh your session automatically.',
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
    const interval = setInterval(checkExpiration, 60_000);
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
