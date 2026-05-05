'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/styles/toast-styles';

export function HomeNotifications() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('logout') === 'success') {
      toast.success('Signed out successfully', {
        description: 'You have been logged out.',
      });
      router.replace('/', { scroll: false });
      return;
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'logout_failed': {
          toast.error('Logout error', {
            description: 'There was an issue signing you out. Please try again.',
          });
          break;
        }
        case 'session_invalid': {
          toast.warning('Session invalid', {
            description: 'Your session was invalid and has been cleared.',
          });
          break;
        }
        case 'session_expired':
        case 'SessionExpired': {
          toast.warning('Session expired', {
            description: 'Your session has expired. Please sign in again.',
          });
          break;
        }
        case 'session_revoked': {
          toast.warning('Session revoked', {
            description: 'Your session was terminated. Please sign in again.',
          });
          break;
        }
        default: {
          toast.info('Notice', {
            description: 'You have been signed out.',
          });
        }
      }
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
