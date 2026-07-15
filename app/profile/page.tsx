'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { UserProfileView } from '@/features/user/components/user-profile-view';
import { Card, CardContent } from '@/components/shadcn/card';
import { toast } from '@/lib/styles/toast-styles';
import { AppLayout } from '@/features/common/components/app-layout';
import { FloatingChat } from '@/features/chat/components/floating';

/**
 * Loading skeleton for profile page
 */
function ProfileSkeleton() {
  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="bg-muted h-32 w-32 animate-pulse rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="bg-muted h-8 w-48 animate-pulse rounded" />
              <div className="bg-muted h-4 w-64 animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="bg-muted h-6 w-20 animate-pulse rounded" />
                <div className="bg-muted h-6 w-32 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
              <div className="space-y-3">
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/**
 * Profile Page Component
 *
 * Client component that displays the user profile.
 * Uses React Query's useUser hook which reads from the cache
 * populated by UserPrefetcher on login.
 */
export default function ProfilePage() {
  const router = useRouter();
  const loginToastShown = useRef(false);

  // Get user data (including attachments) from React Query cache (prefetched on login)
  const { data: user, isLoading, error } = useUser();

  // Show login success toast if redirected from login (client-side only)
  useEffect(() => {
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.location.search);
      const loginParam = params.get('login');
      if (loginParam === 'success' && !loginToastShown.current) {
        loginToastShown.current = true;

        const timer = setTimeout(() => {
          toast.success('Login successful!', {
            description: 'Welcome to your profile.',
          });

          // Clean up URL
          const url = new URL(globalThis.location.href);
          url.searchParams.delete('login');
          globalThis.history.replaceState({}, '', url.toString());
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <AppLayout floatingChat={<FloatingChat />}>
        <div className="px-4 py-8">
          <ProfileSkeleton />
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (error || !user) {
    return (
      <AppLayout floatingChat={<FloatingChat />}>
        <div className="px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Failed to load profile. Please try refreshing the page.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout floatingChat={<FloatingChat />}>
      <div className="px-4 py-8">
        <UserProfileView
          user={user}
          showEditButton={true}
          onEdit={handleEdit}
        />
      </div>
    </AppLayout>
  );
}
