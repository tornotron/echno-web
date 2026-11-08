'use client';

import { ActiveFilterChip, PageHeader, OrgGuard } from '@/components/common';
import { Plus } from 'lucide-react';
import { useMemberInvitations } from '@tornotron/echno-core/member-invitations/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import {
  InvitationTable,
  InvitationEmptyState,
  InvitationOverview,
} from '@/features/invitation';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';
import { routes } from '@/nav';
import { useEmployeeFilterFromParams } from '@/hooks/use-employee-filter';

/**
 * The largest page the backend serves. The list is read in one page so the
 * search, the state filter and the manager link below narrow everything the
 * organization has sent, not only the newest ten.
 */
const INVITATION_PAGE = { pageNo: 0, pageSize: 500 } as const;

export default function InvitationsPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const {
    data: invitations,
    isLoading,
    error,
  } = useMemberInvitations(INVITATION_PAGE);

  const allInvitations = invitations || [];

  // This list answers one role, declared once. A link carrying another
  // module's slug now narrows nothing and says nothing, instead of naming a
  // person over a list nothing narrowed.
  //
  // The whole collection is loaded (up to the page above), so narrowing it
  // here hides nothing. The manager id is an employee id, resolved through the employee lookup by the
  // same `useManagerName` the detail screen uses to name it.
  const { chip, filtered: invitationsList } = useEmployeeFilterFromParams({
    rows: allInvitations,
    roles: { manager: (i) => i.employee.managerId },
  });

  return (
    <OrgGuard
      isLoading={isUserLoading || isLoading}
      error={error}
      organizationId={user?.defaultOrganizationId}
    >
      {/*
        The empty state is keyed on the unfiltered collection. Keying it on the
        filtered one would answer a filter that matches nothing with "no
        invitations yet" and no chip, leaving no way back.
      */}
      {allInvitations.length === 0 ? (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Invitations"
            description="Invite people by email and follow each invitation"
          />
          <InvitationEmptyState />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Invitations"
            description="Invite people by email and follow each invitation"
            actions={
              <Button asChild>
                <Link href={routes.workforce.employees.invitations.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Person
                </Link>
              </Button>
            }
          />

          {chip && <ActiveFilterChip {...chip} />}

          <InvitationOverview invitations={invitationsList} />

          <InvitationTable invitations={invitationsList} />
        </div>
      )}
    </OrgGuard>
  );
}
