'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Organization } from '@/types/organization';
import { useOrganization } from '@/hooks/organization/use-organizations';
import { useUpdateOrganization } from '@/hooks/organization/use-organization-mutations';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { organizationKeys } from '@/hooks/organization/organization-keys';
import { SaveOrganizationDialog } from './organization-alert-dialogs';
import { OrganizationForm } from './organization-form';

interface EditOrganizationFormProps {
  id: number;
}

export function EditOrganizationForm({ id }: EditOrganizationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: organization,
    isLoading: isLoadingOrg,
    error,
  } = useOrganization(id);
  const { mutate: updateOrganization, isPending: isUpdating } =
    useUpdateOrganization();
  const { mutateAsync: deleteAttachmentAsync } = useDeleteAttachment();

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

  if (!isLoadingOrg && (error || !organization)) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading organization
      </div>
    );
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

  const handleRemoveLogo = async () => {
    const logoId = organization?.logo?.id;
    if (!logoId) return;
    await deleteAttachmentAsync(logoId);
    queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    queryClient.invalidateQueries({ queryKey: organizationKeys.detail(id) });
  };

  const handleCancel = () => {
    router.push(`/users/dashboard/organizations/${organization?.id}`);
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
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
