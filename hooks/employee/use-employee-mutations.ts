import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { CreateEmployeeRequest } from '@/types/employee/employee-create';
import { UpdateEmployeeRequest } from '@/types/employee/employee-update';
import { toast } from '@/lib/styles/toast-styles';
import { employeeKeys } from './employee-keys';
import { organizationKeys } from '@/hooks/organization/organization-keys';
import { userKeys } from '@/hooks/user/user-keys';

/**
 * Hook to create a new employee.
 * Invalidates the employees cache on success.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateEmployeeRequest) => employeeService.create(dto),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success('Employee Created', {
        description: `${newEmployee.name} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create employee', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to update an existing employee.
 * Invalidates both the employee detail and list caches on success.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeRequest }) =>
      employeeService.update(id, data),
    onSuccess: (updatedEmployee, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success('Employee Updated', {
        description: `${updatedEmployee.name}'s information has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update employee', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to delete an employee.
 * Invalidates the employees cache on success.
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      toast.success('Employee Deleted', {
        description: 'The employee has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete employee', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to join a user to an organization as an employee.
 * Invalidates both employees and user caches on success.
 */
export function useJoinOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      organizationId,
    }: {
      userId: number;
      organizationId: number;
    }) => employeeService.joinOrganization(userId, organizationId),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success('Joined Organization', {
        description: `Successfully joined as ${employee.designation || 'employee'}.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to join organization', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to assign a manager to an employee.
 * Invalidates employee caches on success.
 */
export function useAssignManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      managerId,
    }: {
      employeeId: number;
      managerId: number;
    }) => employeeService.assignManager(employeeId, managerId),
    onSuccess: (employee, { employeeId }) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.subordinates() });
      toast.success('Manager Assigned', {
        description: `${employee.managerName || 'Manager'} has been assigned successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to assign manager', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to remove a manager from an employee.
 * Invalidates employee caches on success.
 */
export function useRemoveManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) =>
      employeeService.removeManager(employeeId),
    onSuccess: (employee, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.subordinates() });
      toast.success('Manager Removed', {
        description: 'The reporting manager has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to remove manager', {
        description: error.message,
      });
    },
  });
}
