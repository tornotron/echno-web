'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';
import { useUser } from '@/hooks/user/use-user';
import { useCreateOrganization } from '@/hooks/organization/use-organization-mutations';
import { organizationService } from '@/services/organization-service';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { mutate: createOrganization, isPending } = useCreateOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Partial<Organization>, logoFile?: File) => {
    // Ensure creatorId is set from the current user
    if (!currentUser?.id) {
      toast.error('User not found', {
        description: 'Please log in again',
      });
      return;
    }

    const organizationData: Organization = {
      ...data,
      creatorId: currentUser.id,
    } as Organization;

    // If there's a logo file, use the createWithFiles method directly
    if (logoFile) {
      setIsSubmitting(true);
      try {
        await organizationService.createWithFiles(organizationData, {
          organizationLogo: logoFile,
        });
        toast.success('Organization Created', {
          description: 'The organization has been created successfully',
        });
        router.push('/users/dashboard/organizations');
      } catch (error) {
        logger.error('Failed to create organization with files:', error);
        toast.error('Failed to Create Organization', {
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // No logo file, use the regular mutation
      createOrganization(organizationData, {
        onSuccess: () => {
          router.push('/users/dashboard/organizations');
        },
      });
    }
  };

  const handleCancel = () => {
    router.push('/users/dashboard/organizations');
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">User not found</p>
          <p className="text-sm text-zinc-600">Please log in again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Form */}
      <OrganizationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isPending || isSubmitting}
      />
    </div>
  );
}
