'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { Plus, X, Loader2 } from 'lucide-react';
import type { Employee } from '@tornotron/echno-core/employee/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { getDepartmentLabel } from '@tornotron/echno-core/employee/types';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import {
  useAddEmployeeToProject,
  useRemoveEmployeeFromProject,
} from '@tornotron/echno-core/project/hooks';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import { ApiError } from '@/lib/api/api-client';
import { userFacingErrorMessage } from '@/lib/utils/api-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';

interface TeamMembersSectionProps {
  projectId: number;
  members: Employee[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  /**
   * Whether the viewer may add and remove team members: `system-admin` or
   * `project-manager` on the backend (`PROJECT_WRITE_ACCESS`). Without it the
   * roster is read only and the add dialog is never mounted, because the
   * employee list it offers is management-only and would come back empty for
   * anyone else, which used to read as "everyone is already on the team"
   * (echno-web#505).
   */
  canManage: boolean;
}

export function TeamMembersSection({
  projectId,
  members: projectEmployees,
  isDialogOpen,
  onDialogOpenChange,
  canManage,
}: TeamMembersSectionProps) {
  const removeEmployee = useRemoveEmployeeFromProject();
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(
    null
  );

  const handleRemoveEmployee = () => {
    if (!employeeToRemove?.id) return;
    removeEmployee.mutate(
      { projectId, employeeId: employeeToRemove.id },
      {
        onSuccess: () => {
          toast.success('Employee Removed', {
            description: 'The employee has been removed from the project',
          });
          setEmployeeToRemove(null);
        },
        onError: (error) => {
          const title = getErrorTitle(error, 'Failed to Remove Employee');
          const description = getErrorMessage(error);
          toast.error(title, { description });
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <AddTeamMembersDialog
          projectId={projectId}
          members={projectEmployees}
          open={isDialogOpen}
          onOpenChange={onDialogOpenChange}
        />
      )}

      {/* Remove Employee Confirmation */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => {
          if (!open) setEmployeeToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-semibold">{employeeToRemove?.name}</span>{' '}
              from this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeEmployee.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveEmployee}
              disabled={removeEmployee.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeEmployee.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employees List */}
      {projectEmployees.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No team members added yet
        </p>
      ) : (
        <div className="space-y-2">
          {projectEmployees.map((employee) => (
            <div
              key={employee.id ?? employee.email}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <EmployeeAvatar employee={employee} size="sm" />
                <div>
                  {/*
                    Every other person's name in the app is a "who did this"
                    stamp on a document, and clicking it opens that module's
                    list filtered to them. A roster entry is a membership
                    rather than an action, so it goes to this project's task
                    list narrowed to them: read on a project page, the question
                    the name raises is what this person is doing here. Their
                    work everywhere is a click further on from their profile.

                    Only the name is a link. The row also carries a remove
                    button, so wrapping the whole thing would swallow it.
                  */}
                  <p className="text-sm font-medium">
                    {employee.id == null ? (
                      employee.name
                    ) : (
                      <Link
                        href={employeeFilterHref(
                          routes.projects.allProjects.detail(projectId).tasks
                            .href,
                          employee.id,
                          'assignee'
                        )}
                        className="hover:underline"
                      >
                        {employee.name}
                      </Link>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {employee.designation} •{' '}
                    {getDepartmentLabel(employee.department)}
                  </p>
                </div>
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${employee.name} from the team`}
                  onClick={() => setEmployeeToRemove(employee)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * What to say when the employee list cannot be read. A 403 is the one a
 * member without a management role would meet; saying so beats an empty list.
 */
function employeeListErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return 'You do not have permission to see the employee list, so you cannot add members to this team.';
  }
  return userFacingErrorMessage(
    error,
    'The employee list could not be loaded.'
  );
}

interface AddTeamMembersDialogProps {
  projectId: number;
  members: Employee[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Offers the organization's employees who are not yet on the team.
 *
 * Its own component so that the management-only employee list is requested
 * only for viewers who may add members.
 */
function AddTeamMembersDialog({
  projectId,
  members: projectEmployees,
  open,
  onOpenChange,
}: AddTeamMembersDialogProps) {
  const {
    data: allEmployees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useEmployees();
  const addEmployee = useAddEmployeeToProject();

  // Filter out employees already in the project
  const availableEmployees = (allEmployees ?? []).filter(
    (emp) => !projectEmployees.some((e) => e.id === emp.id)
  );

  const handleAddEmployee = (employeeId: number) => {
    addEmployee.mutate(
      { projectId, employeeId },
      {
        onSuccess: () => {
          toast.success('Employee Added', {
            description: 'The employee has been added to the project',
          });
          onOpenChange(false);
        },
        onError: (error) => {
          const title = getErrorTitle(error, 'Failed to Add Employee');
          const description = getErrorMessage(error);
          toast.error(title, { description });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
          <DialogDescription>
            Select employees from your organization to add to this project
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : employeesError ? (
            <p className="text-muted-foreground py-8 text-center">
              {employeeListErrorMessage(employeesError)}
            </p>
          ) : availableEmployees.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              All employees have been added to the team
            </p>
          ) : (
            availableEmployees.map((employee) => (
              <div
                key={employee.id}
                className="hover:bg-accent flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <EmployeeAvatar employee={employee} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{employee.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {employee.designation} •{' '}
                      {getDepartmentLabel(employee.department)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={addEmployee.isPending}
                  onClick={() => handleAddEmployee(employee.id)}
                >
                  {addEmployee.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
