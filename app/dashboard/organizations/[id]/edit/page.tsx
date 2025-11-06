'use client';

import { useRouter, notFound } from 'next/navigation';
import { useState, use } from 'react';
import { AppLayout } from '@/components/common/app-layout';
import { OrganizationForm } from '@/components/organization/organization-form';
import { Organization } from '@/types/organization';
import { mockOrganizations } from '@/lib/mock-data';
import { toast } from '@/lib/styles/toast-styles';

interface EditOrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const organization = mockOrganizations.find((org) => org.id === parseInt(resolvedParams.id));

  if (!organization) {
    notFound();
  }

  const handleSubmit = async (data: Partial<Organization>) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make an API call to update the organization
      console.log('Updating organization:', { id: organization.id, ...data });

      toast.success('Organization updated!', {
        description: `${data.organizationName} has been successfully updated.`,
      });

      // Redirect to organization detail page
      router.push(`/dashboard/organizations/${organization.id}`);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update organization. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/organizations/${organization.id}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Form */}
        <OrganizationForm
          organization={organization}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
