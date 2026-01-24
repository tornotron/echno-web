'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { handleSignOut } from '@/lib/utils/auth-utils';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Button disabled variant="outline" size="sm">
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (session) {
    const onSignOut = async () => {
      setIsSigningOut(true);
      try {
        await handleSignOut();
        // Toast will be shown on the login page after redirect
      } catch (error) {
        logger.error('Sign out error:', error);
        setIsSigningOut(false);
      }
    };

    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Welcome,{' '}
          <span className="font-medium">
            {session.user?.name || session.user?.email}
          </span>
        </span>
        <Button
          onClick={onSignOut}
          variant="outline"
          size="sm"
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => router.push('/register')}
        variant="outline"
        size="sm"
      >
        Register
      </Button>
      <Button onClick={() => signIn('keycloak')} size="sm">
        Sign In
      </Button>
    </div>
  );
}
