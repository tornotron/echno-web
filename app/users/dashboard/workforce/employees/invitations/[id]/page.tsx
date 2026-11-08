'use client';

import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { PageHeader } from '@/components/common/page-header';
import { AtSign, Briefcase, Building2, Loader2, User } from 'lucide-react';
import { useMemberInvitation } from '@tornotron/echno-core/member-invitations/hooks';
import { useManagerName } from '@tornotron/echno-core/employee/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import {
  InvitationActions,
  InvitationErrorState,
  InvitationStatusBadge,
} from '@/features/invitation';
import { STAGE_EXPLANATION } from '@/features/invitation/lib/invitation-stage';
import { useInvitationNames } from '@/features/invitation/lib/use-invitation-names';
import Link from 'next/link';
import { routes } from '@/nav';
import { employeeFilterHref } from '@/hooks/use-employee-filter';

const when = (date?: Date) =>
  date ? format(date, "MMM dd, yyyy 'at' h:mm a") : undefined;

function Fact({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

export default function InvitationPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: invitation, isLoading, error } = useMemberInvitation(id);
  const names = useInvitationNames();

  const managerName = useManagerName(invitation?.employee.managerId);

  const { data: shifts = [] } = useShifts();
  const shiftTimingId = invitation?.employee.shiftTimingId;
  const assignedShift =
    shiftTimingId == null
      ? undefined
      : shifts.find((shift) => shift.id === shiftTimingId);
  const shiftTimingLabel = assignedShift
    ? `${assignedShift.shiftName} (${assignedShift.startTime} - ${assignedShift.endTime})`
    : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !invitation) {
    return <InvitationErrorState />;
  }

  const { employee } = invitation;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invitation Details"
        badge={<InvitationStatusBadge status={invitation.status} />}
        description={invitation.email}
        className="mb-8"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                What the person holds once they accept, on top of what every
                employee holds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitation.roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No role. The person holds only what every employee holds.
                </p>
              ) : (
                <ul className="space-y-2">
                  {invitation.roles.map((role) => (
                    <li
                      key={`${role.roleId}-${role.projectId ?? 'org'}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/15">
                        <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {names.describe(role)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Fact label="Employee ID" value={employee.employeeId} />
                <Fact label="Designation" value={employee.designation} />
                <Fact label="Department" value={employee.department} />
                <Fact
                  label="Joining Date"
                  value={
                    employee.joiningDate
                      ? format(employee.joiningDate, 'MMM dd, yyyy')
                      : undefined
                  }
                />
                <Fact
                  label="Salary"
                  value={
                    employee.salary
                      ? `₹${employee.salary.toLocaleString()}`
                      : undefined
                  }
                />
                <Fact label="Shift Timing" value={shiftTimingLabel} />
                <Fact
                  label="Reporting Manager"
                  value={
                    managerName && invitation.employee.managerId ? (
                      /*
                        An employee id: managerId points into the employee
                        directory, which is how useManagerName resolves the
                        name beside it.
                      */
                      <Link
                        href={employeeFilterHref(
                          routes.workforce.employees.invitations.href,
                          invitation.employee.managerId,
                          'manager'
                        )}
                        className="hover:underline"
                      >
                        {managerName}
                      </Link>
                    ) : (
                      managerName || undefined
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          {invitation.status === 'ACCEPTED' && (
            <Card>
              <CardHeader>
                <CardTitle>The Person</CardTitle>
                <CardDescription>
                  From their account when they accepted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-zinc-500" />
                    <Fact label="Name" value={employee.employeeName} />
                  </div>
                  <div className="flex items-start gap-3">
                    <AtSign className="mt-0.5 h-5 w-5 text-zinc-500" />
                    <Fact label="Email" value={employee.email} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>State</CardTitle>
              <CardDescription data-testid="invitation-stage-explanation">
                {STAGE_EXPLANATION[invitation.status]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Fact label="Invited" value={when(invitation.createdAt)} />
                <Fact
                  label="Link sent"
                  value={
                    when(invitation.sentAt) ??
                    (invitation.status === 'PENDING'
                      ? 'Waiting to be sent'
                      : undefined)
                  }
                />
                <Fact label="Expires" value={when(invitation.expiresAt)} />
                <Fact label="Accepted" value={when(invitation.acceptedAt)} />
                <Fact label="Revoked" value={when(invitation.revokedAt)} />
              </div>
              <InvitationActions invitation={invitation} layout="panel" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Building2 className="mt-0.5 h-5 w-5 text-zinc-500" />
              <p className="text-muted-foreground text-sm">
                Only {invitation.email} can accept this invitation. Someone who
                accepts with a different address is not added.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
