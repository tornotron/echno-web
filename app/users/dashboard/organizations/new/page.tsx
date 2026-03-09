'use client';

import { useRouter } from 'next/navigation';
import { OrganizationForm } from '@/features/organization';
import { Organization } from '@/types/organization';
import { toast } from '@/lib/styles/toast-styles';
import { useUser } from '@/hooks/user/use-user';
import { useCreateOrganization } from '@/hooks/organization/use-organization-mutations';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { mutate: createOrganization, isPending } = useCreateOrganization();

  const handleSubmit = async (data: Partial<Organization>, logoFile?: File) => {
    if (!currentUser?.id) {
      toast.error('User not found', {
        description: 'Please log in again',
      });
      return;
    }

    const organizationData: Organization = {
      ...data,
      creatorId: currentUser.id,
    } as Organization;

    createOrganization(
      { data: organizationData, logoFile },
      {
        onSuccess: () => {
          router.push('/users/dashboard/organizations');
        },
      }
    );
  };

  const handleCancel = () => {
    router.push('/users/dashboard/organizations');
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
