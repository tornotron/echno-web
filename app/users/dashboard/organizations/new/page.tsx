'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/features/organization';
import { UpdateOrganizationRequest } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';
import { useUser } from '@/hooks/user/use-user';
import { useCreateOrganization } from '@/hooks/organization/use-organization-mutations';
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
          router.push(routes.organizations.href);
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
