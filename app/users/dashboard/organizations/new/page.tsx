'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';
import { useSession } from 'next-auth/react';

import { useCreateOrganization } from '@/hooks/organization/use-organization-mutations';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { mutate: createOrganization, isPending } = useCreateOrganization();

  const handleSubmit = (data: Partial<Organization>) => {
    // Ensure creatorId is set from the current user's session
    if (!session?.user?.id) {
      toast.error('User session not found', {
        description: 'Please log in again',
      });
      return;
    }

    const organizationData: Organization = {
      ...data,
      creatorId: Number.parseInt(session.user.id),
    } as Organization;

    createOrganization(organizationData, {
      onSuccess: () => {
        router.push('/users/dashboard/organizations');
      },
    });
  };

  const handleCancel = () => {
    router.push('/users/dashboard/organizations');
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Form */}
      <OrganizationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isPending}
      />
    </div>
  );
}
