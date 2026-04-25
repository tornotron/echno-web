'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { handleSignOut } from '@/lib/utils/auth-utils';
import { LogIn, LogOut, UserPlus, Loader2 } from 'lucide-react';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  /* ── Loading ────────────────────────────────────────────────────── */
  if (status === 'loading') {
    return (
      <div className="flex h-8 w-16 items-center justify-center rounded-lg border border-stone-200 bg-white text-zinc-400 dark:border-white/8 dark:bg-white/4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </div>
    );
  }

  /* ── Authenticated ─────────────────────────────────────────────── */
  if (session) {
    const onSignOut = async () => {
      setIsSigningOut(true);
      try {
        await handleSignOut();
      } catch (error) {
        logger.error('Sign out error:', error);
        setIsSigningOut(false);
      }
    };

    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-zinc-600 lg:block dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {session.user?.name?.split(' ')[0] ?? session.user?.email}
          </span>
        </span>
        <button
          onClick={onSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-zinc-900 disabled:opacity-60 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white"
        >
          {isSigningOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    );
  }

  /* ── Unauthenticated ───────────────────────────────────────────── */
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push('/register')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-zinc-900 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Register
      </button>
      <button
        onClick={() => signIn('keycloak')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-zinc-900 dark:border-white/8 dark:bg-white/4 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign In
      </button>
    </div>
  );
}
