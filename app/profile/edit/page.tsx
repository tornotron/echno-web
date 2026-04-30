'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/user/use-user';
import { ProfileEditForm } from '@/features/user/components/profile-edit-form';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/features/common/components/app-layout';
import { FloatingChat } from '@/features/chat/components/floating';

/**
 * Loading skeleton for edit profile page
 */
function EditProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-muted h-10 w-10 animate-pulse rounded" />
        <div className="flex-1">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-10 w-full animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Edit Profile Page Component
 *
 * Client component for editing user profile.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useUser();

  const handleCancel = () => {
    router.push('/profile');
  };

  const handleSuccess = () => {
    router.push('/profile');
  };

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <AppLayout floatingChat={<FloatingChat />}>
        <div className="px-4 py-8">
          <EditProfileSkeleton />
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
              <p className="text-muted-foreground mb-4">
                Failed to load profile. Please try refreshing the page.
              </p>
              <Button onClick={() => router.push('/profile')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout floatingChat={<FloatingChat />}>
      <div className="px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-muted-foreground mt-2">
              Update your personal information and settings
            </p>
          </div>
          <ProfileEditForm
            user={user}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </AppLayout>
  );
}
