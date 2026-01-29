import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { Employee } from '@/types/employee/employee';
import { toast } from '@/lib/styles/toast-styles';

/**
 * Hook to create a new employee.
 * Invalidates the employees cache on success.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Partial<Employee>) =>
      employeeService.create(employee),
    onSuccess: (newEmployee) => {
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      employeeService.update(id, data),
    onSuccess: (updatedEmployee, { id }) => {
      // Invalidate both the specific employee and the list
      queryClient.invalidateQueries({ queryKey: ['employees', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
      // Invalidate employees list and remove the specific employee from cache
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.removeQueries({ queryKey: ['employees', id] });
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
      // Invalidate employees and user data
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
