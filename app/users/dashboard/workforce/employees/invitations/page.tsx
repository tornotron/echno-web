'use client';

import { PageHeader } from '@/components/common';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useInvitationsByOrganization } from '@/hooks/invitation';
import { useUser } from '@/hooks/user/use-user';
import {
  InvitationTable,
  InvitationEmptyState,
  InvitationOverview,
} from '@/features/invitation';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';

export default function InvitationsPage() {
  const { data: user } = useUser();
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByOrganization(user?.defaultOrganizationId);

  const invitationsList = invitations || [];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">
          Error Loading Invitations
        </h2>
        <p className="text-zinc-500">
          Failed to load invitations. Please try again later.
        </p>
      </div>
    );
  }

  if (!user?.defaultOrganizationId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
        <p className="text-zinc-500">
          Please select an organization to view invitations.
        </p>
      </div>
    );
  }

  if (invitationsList.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Employee Invitations"
          description="Manage and track employee invitation status"
        />
        <InvitationEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Employee Invitations"
        description="Manage and track employee invitation status"
        actions={
          <Button asChild>
            <Link href="/users/dashboard/workforce/employees/invitations/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invitation
            </Link>
          </Button>
        }
      />

      <InvitationOverview invitations={invitationsList} />

      <InvitationTable invitations={invitationsList} />
    </div>
  );
}
