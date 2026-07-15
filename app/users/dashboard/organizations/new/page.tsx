'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/features/organization';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { UpdateOrganizationRequest } from '@tornotron/echno-core/organization/types';
import { useCreateOrganization } from '@tornotron/echno-core/organization/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { mutate: createOrganization, isPending } = useCreateOrganization();

  const handleSubmit = (data: UpdateOrganizationRequest, logoFile?: File) => {
    if (!currentUser?.id) {
      toast.error('User not found', {
        description: 'Please log in again',
      });
      return;
    }

    createOrganization(
      {
        data: {
          organizationName: data.organizationName!,
          organizationAddress: data.organizationAddress!,
          organizationEmail: data.organizationEmail!,
          organizationPhone: data.organizationPhone!,
          organizationWebsite: data.organizationWebsite,
          creatorId: currentUser.id,
          isActive: data.isActive,
        },
        files: logoFile ? { logo: logoFile } : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Organization Created', {
            description: 'The organization has been created successfully',
          });
          router.push(routes.organizations.href);
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Failed to Create Organization'), {
            description: getErrorMessage(error),
          });
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(routes.organizations.href);
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
        isLoading={isPending}
      />
    </div>
  );
}
