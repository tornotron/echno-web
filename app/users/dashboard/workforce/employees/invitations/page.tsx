'use client';

import { ActiveFilterChip, PageHeader, OrgGuard } from '@/components/common';
import { Plus } from 'lucide-react';
import { useInvitationsByOrganization } from '@tornotron/echno-core/invitation/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import {
  InvitationTable,
  InvitationEmptyState,
  InvitationOverview,
} from '@/features/invitation';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';
import { routes } from '@/nav';
import {
  ROLE_LABELS,
  rowMatchesEmployeeFilter,
  useEmployeeFilterFromParams,
} from '@/hooks/use-employee-filter';

export default function InvitationsPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByOrganization(user?.defaultOrganizationId);

  const {
    employeeId,
    role,
    name: filterName,
    clear: clearEmployeeFilter,
  } = useEmployeeFilterFromParams();

  // This list answers one role. A link carrying another module's slug is
  // already a no-op here, because rowMatchesEmployeeFilter fails open for a
  // role it has no accessor for; the chip is what would turn that no-op into a
  // wrong answer, by naming a person over a list nothing narrowed.
  const managerFilterApplies = employeeId != null && role === 'manager';

  const allInvitations = invitations || [];
  // The whole collection is loaded, so narrowing it here hides nothing. The
  // manager id is an employee id, resolved through the employee lookup by the
  // same `useManagerName` the detail screen uses to name it.
  const invitationsList = managerFilterApplies
    ? allInvitations.filter((invitation) =>
        rowMatchesEmployeeFilter(invitation, employeeId, 'manager', {
          manager: (i) => i.employeeDetails.managerId,
        })
      )
    : allInvitations;

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

          {managerFilterApplies && filterName && (
            <ActiveFilterChip
              label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
              name={filterName}
              onDismiss={clearEmployeeFilter}
            />
          )}

          <InvitationOverview invitations={invitationsList} />

          <InvitationTable invitations={invitationsList} />
        </div>
      )}
    </OrgGuard>
  );
}
