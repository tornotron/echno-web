'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from '@/lib/styles/toast-styles';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { HomeDashboard } from '@/features/dashboard/components/home-dashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loginToastShown = useRef(false);
  const { data: user } = useUser();
  const displayName =
    user?.name?.split(' ')[0] ?? session?.user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Show login success toast if redirected from login
  useEffect(() => {
    if (
      globalThis.window !== undefined &&
      status === 'authenticated' &&
      !loginToastShown.current
    ) {
      const params = new URLSearchParams(globalThis.location.search);
      const loginParam = params.get('login');

      if (loginParam === 'success') {
        loginToastShown.current = true;

        // Show toast after a small delay to ensure component is mounted
        const timer = setTimeout(() => {
          toast.success('Login successful!', {
            description: 'Welcome back to your dashboard.',
          });

          // Clean up URL by removing the login parameter
          const url = new URL(globalThis.location.href);
          url.searchParams.delete('login');
          globalThis.history.replaceState({}, '', url.toString());
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'}
          , {displayName}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening on site today.
        </p>
      </div>

      <HomeDashboard />
    </div>
  );
}
