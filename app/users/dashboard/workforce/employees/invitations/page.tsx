'use client';

import { PageHeader, OrgGuard } from '@/components/common';
import { Plus } from 'lucide-react';
import { useInvitationsByOrganization } from '@/hooks/invitation';
import { useUser } from '@/hooks/user/use-user';
import {
  InvitationTable,
  InvitationEmptyState,
  InvitationOverview,
} from '@/features/invitation';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';
import { routes } from '@/nav';

export default function InvitationsPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByOrganization(user?.defaultOrganizationId);

  const invitationsList = invitations || [];

  return (
    <OrgGuard
      isLoading={isUserLoading || isLoading}
      error={error}
      organizationId={user?.defaultOrganizationId}
    >
      {invitationsList.length === 0 ? (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Invitations"
            description="Manage and track employee invitation status"
          />
          <InvitationEmptyState />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Invitations"
            description="Manage and track employee invitation status"
            actions={
              <Button asChild>
                <Link href={routes.workforce.employees.invitations.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invitation
                </Link>
              </Button>
            }
          />

          <InvitationOverview invitations={invitationsList} />

          <InvitationTable invitations={invitationsList} />
        </div>
      )}
    </OrgGuard>
  );
}
