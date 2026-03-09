'use client';

import { useRouter, notFound } from 'next/navigation';
import { use, useState } from 'react';
import {
  SaveOrganizationDialog,
  OrganizationForm,
} from '@/features/organization';
import { Organization } from '@/types/organization';
import { useOrganization } from '@/hooks/organization/use-organizations';
import { useUpdateOrganization } from '@/hooks/organization/use-organization-mutations';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { useQueryClient } from '@tanstack/react-query';

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
  const { mutate: deleteAttachment } = useDeleteAttachment();
  const queryClient = useQueryClient();
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<{
    data: Partial<Organization>;
    logoFile?: File;
  } | null>(null);

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

  const handleSubmit = (data: Partial<Organization>, logoFile?: File) => {
    if (!organization) return;
    setPendingData({ data, logoFile });
    setShowConfirmUpdate(true);
  };

  const handleConfirmUpdate = () => {
    if (!organization || !pendingData) return;
    const updatedOrg = { ...organization, ...pendingData.data };
    updateOrganization(
      {
        id: organization.id!,
        data: updatedOrg,
        logoFile: pendingData.logoFile,
      },
      {
        onSuccess: () => {
          router.push(`/users/dashboard/organizations/${organization.id}`);
        },
        onSettled: () => {
          setShowConfirmUpdate(false);
          setPendingData(null);
        },
      }
    );
  };

  const handleRemoveLogo = () => {
    const logoId = organization?.logo?.id;
    if (!logoId) return;
    deleteAttachment(logoId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        queryClient.invalidateQueries({ queryKey: ['organizations', id] });
      },
    });
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
          onRemoveLogo={handleRemoveLogo}
          isLoading={isUpdating}
        />
      )}

      <SaveOrganizationDialog
        open={showConfirmUpdate}
        onOpenChange={(open) => {
          setShowConfirmUpdate(open);
          if (!open) setPendingData(null);
        }}
        organizationName={organization?.organizationName ?? ''}
        isPending={isUpdating}
        onConfirm={handleConfirmUpdate}
      />
    </div>
  );
}
