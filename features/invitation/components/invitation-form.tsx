'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Loader2, Send } from 'lucide-react';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  ApiError,
  getErrorMessage,
  getErrorTitle,
} from '@tornotron/echno-core';
import {
  Department,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import {
  useEmployeeLookup,
  useManagers,
} from '@tornotron/echno-core/employee/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useAccessRoles } from '@tornotron/echno-core/access/hooks';
import { useCreateMemberInvitation } from '@tornotron/echno-core/member-invitations/hooks';
import type { CreateMemberInvitationRequest } from '@tornotron/echno-core/member-invitations/types';
import {
  FIRST_EMPLOYEE_NOTE,
  managerFieldErrorFrom,
  managerRequirement,
  resolveManagerId,
} from '../lib/reporting-manager-rule';
import {
  ORGANIZATION_WIDE_NOTE,
  invitableRoles,
  isProjectRefusal,
  refusesProject,
  toInvitationRoles,
  type RoleSelection,
} from '../lib/role-project-rule';

// Sentinel Select values (shadcn Select forbids an empty-string item value).
const UNASSIGNED_SHIFT = 'unassigned';
const ACROSS_ORGANIZATION = 'organization';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ROLES_UNAVAILABLE_NOTE =
  "The organization's roles could not be loaded. The invitation can still be sent, and the person then holds only what every employee holds until an administrator gives them a role.";

/**
 * Invites a person by email. The identity provider sends the link; the
 * person becomes an employee only when they accept it with this address, and
 * then holds the roles chosen here, each across the organization or on one
 * project.
 */
export function InvitationForm() {
  const router = useRouter();
  const create = useCreateMemberInvitation();
  const {
    data: accessRoles,
    isLoading: rolesLoading,
    isError: rolesFailed,
  } = useAccessRoles();
  const roles = invitableRoles(accessRoles ?? []);
  const { data: projects = [] } = useProjects();
  const { data: managers = [], isLoading: managersLoading } = useManagers();
  const { data: shifts = [] } = useShifts();
  // A new employee must have a reporting manager; the first employee of an
  // organization is the one exception. Only active employees count.
  const { data: employeeLookup } = useEmployeeLookup();
  const requirement = managerRequirement(employeeLookup);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selections, setSelections] = useState<RoleSelection[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [details, setDetails] = useState({
    employeeId: '',
    designation: '',
    department: '',
    joiningDate: '',
    salary: '',
    managerId: '',
    shiftTimingId: '',
  });

  const selectionFor = (roleId: string) =>
    selections.find((s) => s.roleId === roleId);

  const toggleRole = (roleId: string, checked: boolean) => {
    setRolesError(null);
    setSelections((current) =>
      checked
        ? [...current.filter((s) => s.roleId !== roleId), { roleId }]
        : current.filter((s) => s.roleId !== roleId)
    );
  };

  const setProject = (roleId: string, value: string) => {
    setRolesError(null);
    setSelections((current) =>
      current.map((s) =>
        s.roleId === roleId
          ? {
              roleId,
              projectId:
                value === ACROSS_ORGANIZATION
                  ? undefined
                  : Number.parseInt(value, 10),
            }
          : s
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError('Enter the email address the invitation goes to');
      return;
    }
    setEmailError(null);

    const manager = resolveManagerId(details.managerId, requirement);
    if ('error' in manager) {
      setManagerError(manager.error);
      return;
    }
    setManagerError(null);

    const request: CreateMemberInvitationRequest = {
      email: address,
      roles: toInvitationRoles(selections, roles),
      employee: {
        employeeId: details.employeeId.trim() || undefined,
        designation: details.designation.trim() || undefined,
        department: details.department || undefined,
        joiningDate: details.joiningDate
          ? new Date(details.joiningDate)
          : undefined,
        salary: details.salary ? Number.parseFloat(details.salary) : undefined,
        managerId: manager.managerId ?? undefined,
        shiftTimingId: details.shiftTimingId
          ? Number.parseInt(details.shiftTimingId, 10)
          : undefined,
      },
    };

    create.mutate(request, {
      onSuccess: (invitation) => {
        toast.success('Invitation sent', {
          description: invitation.expiresAt
            ? `A link is on its way to ${invitation.email}. It expires ${format(invitation.expiresAt, 'MMM dd, yyyy')}.`
            : `A link is on its way to ${invitation.email}.`,
        });
        router.push(
          routes.workforce.employees.invitations.detail(invitation.id).href
        );
      },
      onError: (error) => {
        const fieldError = managerFieldErrorFrom(error);
        if (fieldError) {
          setManagerError(fieldError);
          return;
        }
        if (isProjectRefusal(error)) {
          setRolesError(getErrorMessage(error));
          return;
        }
        if (error instanceof ApiError && error.status === 409) {
          setEmailError(getErrorMessage(error));
          return;
        }
        toast.error(getErrorTitle(error, 'Could not send the invitation'), {
          description: getErrorMessage(error),
        });
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Card>
            <CardHeader>
              <CardTitle>Who to invite</CardTitle>
              <CardDescription>
                Only this exact address can accept the invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmailError(null);
                  setEmail(e.target.value);
                }}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p
                  id="email-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                What the person can do once they accept. Each role holds across
                the organization or on one project. Every employee also holds
                the access all employees have.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rolesLoading && (
                <p className="text-muted-foreground text-sm">
                  Loading roles...
                </p>
              )}
              {!rolesLoading && (rolesFailed || roles.length === 0) && (
                <p
                  className="text-muted-foreground text-sm"
                  data-testid="roles-unavailable"
                >
                  {ROLES_UNAVAILABLE_NOTE}
                </p>
              )}
              {roles.map((role) => {
                const selection = selectionFor(role.id);
                const checked = selection !== undefined;
                const orgWide = refusesProject(role);
                return (
                  <div
                    key={role.id}
                    className="space-y-2 rounded-lg border p-3"
                    data-testid={`role-${role.slug}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleRole(role.id, value === true)
                        }
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                        {role.subtitle && (
                          <p className="text-muted-foreground text-xs">
                            {role.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    {checked &&
                      (orgWide ? (
                        <p
                          className="text-muted-foreground pl-7 text-xs"
                          data-testid={`role-org-wide-${role.slug}`}
                        >
                          {ORGANIZATION_WIDE_NOTE}
                        </p>
                      ) : (
                        <div className="pl-7">
                          <Select
                            value={
                              selection.projectId === undefined
                                ? ACROSS_ORGANIZATION
                                : String(selection.projectId)
                            }
                            onValueChange={(value) =>
                              setProject(role.id, value)
                            }
                          >
                            <SelectTrigger
                              className="w-full sm:w-72"
                              aria-label={`Where ${role.name} holds`}
                              data-testid={`role-project-${role.slug}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ACROSS_ORGANIZATION}>
                                Across the organization
                              </SelectItem>
                              {projects.map((project) => (
                                <SelectItem
                                  key={project.id}
                                  value={String(project.id)}
                                >
                                  On {project.projectName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                  </div>
                );
              })}
              {rolesError && (
                <p className="text-destructive text-sm" role="alert">
                  {rolesError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>
                Recorded on the employee when they accept. Their name and phone
                come from their own account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    placeholder="e.g., EMP-2025-001"
                    value={details.employeeId}
                    onChange={(e) =>
                      setDetails({ ...details, employeeId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="e.g., Senior Engineer"
                    value={details.designation}
                    onChange={(e) =>
                      setDetails({ ...details, designation: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={details.department}
                    onValueChange={(value) =>
                      setDetails({ ...details, department: value })
                    }
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Department).map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {getDepartmentLabel(dept)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={details.joiningDate}
                    onChange={(e) =>
                      setDetails({ ...details, joiningDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (₹)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="e.g., 50000"
                    value={details.salary}
                    onChange={(e) =>
                      setDetails({ ...details, salary: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftTiming">Shift Timing</Label>
                  <Select
                    value={details.shiftTimingId || UNASSIGNED_SHIFT}
                    onValueChange={(value) =>
                      setDetails({
                        ...details,
                        shiftTimingId: value === UNASSIGNED_SHIFT ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger id="shiftTiming">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_SHIFT}>
                        Unassigned
                      </SelectItem>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={String(shift.id)}>
                          {shift.shiftName} ({shift.startTime} - {shift.endTime}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">
                  Reporting Manager
                  {requirement !== 'exempt' && ' *'}
                </Label>
                {requirement === 'exempt' ? (
                  <p
                    className="text-muted-foreground text-sm"
                    data-testid="first-employee-note"
                  >
                    {FIRST_EMPLOYEE_NOTE}
                  </p>
                ) : (
                  <Select
                    value={details.managerId}
                    onValueChange={(value) => {
                      setManagerError(null);
                      setDetails({ ...details, managerId: value });
                    }}
                  >
                    <SelectTrigger
                      id="managerId"
                      aria-invalid={managerError ? true : undefined}
                      aria-describedby={
                        managerError ? 'managerId-error' : undefined
                      }
                    >
                      <SelectValue
                        placeholder={
                          managersLoading
                            ? 'Loading managers...'
                            : 'Select manager'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.length === 0 && !managersLoading && (
                        <SelectItem value="none" disabled>
                          No managers available
                        </SelectItem>
                      )}
                      {managers.map((manager) => (
                        <SelectItem
                          key={manager.id!}
                          value={manager.id!.toString()}
                        >
                          {manager.name} - {manager.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {managerError && requirement !== 'exempt' && (
                  <p
                    id="managerId-error"
                    className="text-destructive text-sm"
                    role="alert"
                  >
                    {managerError}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-sm">
              <li>The person gets an email with a link to join.</li>
              <li>
                They set up their account from the link, with the invited
                address.
              </li>
              <li>
                On their first sign-in they become an employee with the roles
                and details above.
              </li>
              <li>
                Until then you can resend or revoke the invitation from the
                Invitations page. A resend keeps the expiry; renewing an expired
                one sets a new expiry.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
