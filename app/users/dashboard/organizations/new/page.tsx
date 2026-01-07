'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Partial<Organization>) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make an API call to create the organization
      logger.debug('Creating organization:', data);

      toast.success('Organization created!', {
        description: `${data.organizationName} has been successfully created.`,
      });

      // Redirect to organizations list
      router.push('/dashboard/organizations');
    } catch {
      toast.error('Error', {
        description: 'Failed to create organization. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
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
        isLoading={isLoading}
      />
    </div>
  );
}
