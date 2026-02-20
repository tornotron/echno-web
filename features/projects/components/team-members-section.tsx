'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import type { Employee } from '@/types/employee';
import { getDepartmentLabel } from '@/types/employee/departments';
import { useEmployees } from '@/hooks/employee/use-employee';
import {
  useAddEmployeeToProject,
  useRemoveEmployeeFromProject,
} from '@/hooks/project/use-project-mutations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamMembersSectionProps {
  projectId: number;
  members: Employee[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
}

export function TeamMembersSection({
  projectId,
  members: projectEmployees,
  isDialogOpen,
  onDialogOpenChange,
}: TeamMembersSectionProps) {
  const { data: allEmployees, isLoading: isLoadingEmployees } = useEmployees();
  const addEmployee = useAddEmployeeToProject();
  const removeEmployee = useRemoveEmployeeFromProject();
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(
    null
  );

  // Filter out employees already in the project
  const availableEmployees = (allEmployees ?? []).filter(
    (emp) => !projectEmployees.some((e) => e.id === emp.id)
  );

  const handleAddEmployee = (employeeId: number) => {
    addEmployee.mutate(
      { projectId, employeeId },
      {
        onSuccess: () => {
          onDialogOpenChange(false);
        },
      }
    );
  };

  const handleRemoveEmployee = () => {
    if (!employeeToRemove?.id) return;
    removeEmployee.mutate(
      { projectId, employeeId: employeeToRemove.id },
      {
        onSuccess: () => {
          setEmployeeToRemove(null);
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Add Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
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
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                      {employee.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
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
                    onClick={() => handleAddEmployee(employee.id!)}
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
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                  {employee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {employee.designation} •{' '}
                    {getDepartmentLabel(employee.department)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEmployeeToRemove(employee)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
