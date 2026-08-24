'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import {
  OrganizationForm,
  ORGANIZATION_FORM_ID,
} from '@/features/organization';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { UpdateOrganizationRequest } from '@tornotron/echno-core/organization/types';
import { useCreateOrganization } from '@tornotron/echno-core/organization/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
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
      <PageHeader
        sticky
        title="New Organization"
        description="Add a new organization to the system"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.organizations.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={ORGANIZATION_FORM_ID}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Organization
                </>
              )}
            </Button>
          </>
        }
      />
      <OrganizationForm onSubmit={handleSubmit} />
    </div>
  );
}
