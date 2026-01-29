'use client';

import { useRouter, notFound } from 'next/navigation';
import { useState, use } from 'react';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { useOrganizationWithLogo } from '@/hooks/organization/use-organizations';
import { useUpdateOrganization } from '@/hooks/organization/use-organization-mutations';
import { organizationService } from '@/services/organization-service';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';

interface EditOrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditOrganizationPage({
  params,
}: EditOrganizationPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = Number.parseInt(resolvedParams.id);

  const {
    organization,
    isLoading: isLoadingOrg,
    error,
  } = useOrganizationWithLogo(id);
  const { mutate: updateOrganization, isPending: isUpdating } =
    useUpdateOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoadingOrg) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if ((error || !organization) && !isLoadingOrg && error) {
    // Only show 404/error if done loading
    // notFound(); // This might be too aggressive if it's just a fetch error?
    // Let's just show an error message.
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading organization
      </div>
    );
  }
  // Case: Loading finished, no error, but no org? Should be 404 or empty.
  // If isLoading is handled, this might be reachable if enabled=false or something?
  // Assuming getById throws or returns null if not found.
  // But useOrganization types might include undefined.

  // If we really couldn't find it after loading
  if (!isLoadingOrg && !organization && !error) {
    notFound();
  }

  const handleSubmit = async (data: Partial<Organization>, logoFile?: File) => {
    // Merge existing org data with updates to ensure complete object (if needed)
    // The service requires (id, org)
    // The form returns partial updates.
    // We should probably pass the FULL object with updates merged, OR the service should accept Partial.
    // organizationService.update signature: update(id: number, org: Organization).
    // So we need to merge.

    if (!organization) return;

    const updatedOrg = { ...organization, ...data };

    // If there's a logo file, use the updateWithFiles method directly
    if (logoFile) {
      setIsSubmitting(true);
      try {
        await organizationService.updateWithFiles(
          organization.id!,
          updatedOrg,
          { organizationLogo: logoFile }
        );
        toast.success('Organization Updated', {
          description: 'The organization has been updated successfully',
        });
        router.push(`/users/dashboard/organizations/${organization.id}`);
      } catch (error) {
        logger.error('Failed to update organization with files:', error);
        toast.error('Failed to Update Organization', {
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
      updateOrganization(
        { id: organization.id!, data: updatedOrg },
        {
          onSuccess: () => {
            router.push(`/users/dashboard/organizations/${organization.id}`);
          },
        }
      );
    }
  };

  const handleCancel = () => {
    router.push(`/users/dashboard/organizations/${organization?.id}`);
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Form */}
      {organization && (
        <OrganizationForm
          organization={organization}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isUpdating || isSubmitting}
        />
      )}
    </div>
  );
}
