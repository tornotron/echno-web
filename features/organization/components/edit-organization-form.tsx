'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { UpdateOrganizationRequest } from '@tornotron/echno-core/organization/types';
import {
  useOrganization,
  useUpdateOrganization,
} from '@tornotron/echno-core/organization/hooks';
import { useDeleteAttachment } from '@tornotron/echno-core/attachment/hooks';
import { organizationKeys } from '@tornotron/echno-core/organization/hooks/keys';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { SaveOrganizationDialog } from './organization-alert-dialogs';
import { OrganizationForm, ORGANIZATION_FORM_ID } from './organization-form';
import { routes } from '@/nav';

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
    data: UpdateOrganizationRequest;
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

  const handleSubmit = (data: UpdateOrganizationRequest, logoFile?: File) => {
    if (!organization) return;
    setPendingData({ data, logoFile });
    setShowConfirmUpdate(true);
  };

  const handleConfirmUpdate = () => {
    if (!organization || !pendingData) return;
    updateOrganization(
      {
        id: organization.id,
        data: pendingData.data,
        files: pendingData.logoFile
          ? { logo: pendingData.logoFile }
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Organization Updated', {
            description: 'The organization has been updated successfully',
          });
          router.push(routes.organizations.detail(organization.id).href);
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Failed to Update Organization'), {
            description: getErrorMessage(error),
          });
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
    router.push(routes.organizations.detail(organization!.id).href);
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Edit Organization"
        description="Update organization information"
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={ORGANIZATION_FORM_ID}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Organization
                </>
              )}
            </Button>
          </>
        }
      />
      {organization && (
        <OrganizationForm
          organization={organization}
          onSubmit={handleSubmit}
          onRemoveLogo={handleRemoveLogo}
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
