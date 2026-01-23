'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';

import { useCreateOrganization } from '@/hooks/organization/use-organization-mutations';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { mutate: createOrganization, isPending } = useCreateOrganization();

  const handleSubmit = (data: Partial<Organization>) => {
    // We cast data to Organization here because the form returns Partial<Organization>
    // but the service expects Organization. Ideally, types should align better.
    // Assuming the form validation ensures required fields are present.
    createOrganization(data as Organization, {
      onSuccess: () => {
        router.push('/dashboard/organizations');
      },
    });
  };

  const handleCancel = () => {
    router.push('/dashboard/organizations');
  };

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
