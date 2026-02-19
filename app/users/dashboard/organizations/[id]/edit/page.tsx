'use client';

import { useRouter, notFound } from 'next/navigation';
import { use } from 'react';
import { OrganizationForm } from '@/features/organization/organization-form';
import { Organization } from '@/types/organization';
import { useOrganization } from '@/hooks/organization/use-organizations';
import { useUpdateOrganization } from '@/hooks/organization/use-organization-mutations';

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
    data: organization,
    isLoading: isLoadingOrg,
    error,
  } = useOrganization(id);
  const { mutate: updateOrganization, isPending: isUpdating } =
    useUpdateOrganization();

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
    if (!organization) return;

    const updatedOrg = { ...organization, ...data };

    updateOrganization(
      { id: organization.id!, data: updatedOrg, logoFile },
      {
        onSuccess: () => {
          router.push(`/users/dashboard/organizations/${organization.id}`);
        },
      }
    );
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
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
