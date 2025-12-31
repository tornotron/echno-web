import { Suspense } from 'react';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { User } from '@/types/user/user';

import { Card, CardContent } from '@/components/ui/card';
import { fetchUserProfileFromBackend } from '@/lib/api/user-api';
import { AppLayout } from '@/components/common/app-layout';
import { ProfilePageClient } from './profile-client';
import { getAccessToken } from '@/lib/auth/get-session-tokens';

/**
 * Server Component: Fetches user profile data from backend
 * Uses Next.js server-side rendering for optimal performance
 * Fetches directly from Spring Boot backend to maximize static rendering
 */
async function getUserProfile(): Promise<User | null> {
  try {
    const session = await auth();
    const accessToken = await getAccessToken();

    if (!session || !accessToken) {
      return null;
    }

    // Fetch directly from backend using the dedicated API service
    const user = await fetchUserProfileFromBackend(accessToken);
    return user;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Loading skeleton for profile page
 */
function ProfileSkeleton() {
  return (
    <div className="px-4 py-8">
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
    </div>
  );
}

/**
 * Profile Page Component
 * Statically rendered on the server with user data
 */
export default async function ProfilePage() {
  const user = await getUserProfile();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfilePageClient user={user} />
        </Suspense>
      </div>
    </AppLayout>
  );
}

/**
 * Metadata for the profile page
 */
export const metadata = {
  title: 'User Profile | Echno',
  description: 'View and manage your user profile',
};
