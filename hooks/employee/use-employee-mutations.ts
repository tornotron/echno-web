import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { Employee } from '@/types/employee';
import { CreateEmployeeRequest } from '@/types/employee/employee-create';
import { UpdateEmployeeRequest } from '@/types/employee/employee-update';
import { toast } from '@/lib/styles/toast-styles';
import { employeeKeys } from './employee-keys';
import { organizationKeys } from '@/hooks/organization/organization-keys';
import { userKeys } from '@/hooks/user/user-keys';

/**
 * Matches every Employee[] list cache under the 'employees' namespace —
 * `lists()`, `subordinates(managerId)`, `managers()`, `managersByOrg(orgId)`.
 * Excludes `detail(id)` (numeric third segment after 'detail').
 */
function isEmployeeListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return Array.isArray(key) && key[0] === 'employees' && key[1] !== 'detail';
}

/**
 * Backend has no plain POST /employee/web endpoint per the live OpenAPI spec
 * (audited 2026-06-02). Employees are created via `useJoinOrganization`
 * (POST /employee/web/joinOrganization/userId/{userId}/organizationId/{orgId})
 * which links an existing User to an Organization as an Employee.
 *
 * This hook is currently unconsumed but exported. Fails fast with a clear
 * message rather than hitting the non-existent endpoint.
 */
export function useCreateEmployee() {
  return useMutation({
    mutationFn: async (_dto: CreateEmployeeRequest): Promise<Employee> => {
      throw new Error(
        'Direct employee creation is not supported by the backend (no POST /employee/web endpoint). Use useJoinOrganization to add an existing user as an employee of an organization.'
      );
    },
    onError: (error: Error) => {
      toast.error('Not Supported', { description: error.message });
    },
  });
}

/**
 * Hook to update an existing employee.
 *
 * Backend (per spec): `PATCH /employee/web/{id}` returns `ApiResponse` (ack).
 * The service parses the response as Employee (drift, same pattern as
 * useActivateLeavePolicy / useUpdatePOStatus / useUpdateSiteTransferStatus).
 * 3-way guarded patch falls back to cached-detail update if the response
 * isn't a valid Employee.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeRequest }) =>
      employeeService.update(id, data),
    onSuccess: (data, { id, data: requestData }) => {
      // FIXME: spec says ApiResponse, service parses as Employee. Confirm
      // backend response shape and align service signature (Promise<void>)
      // if spec is authoritative.
      const cachedDetail = queryClient.getQueryData<Employee>(
        employeeKeys.detail(id)
      );

      if (data && typeof data.id === 'number') {
        queryClient.setQueryData(employeeKeys.detail(id), data);
        queryClient.setQueriesData<Employee[]>(
          { predicate: isEmployeeListCache },
          (old) => old?.map((e) => (e.id === id ? data : e))
        );
      } else if (cachedDetail) {
        // Service drift fallback: merge request fields onto cached detail.
        const patched: Employee = {
          ...cachedDetail,
          ...requestData,
        } as Employee;
        queryClient.setQueryData(employeeKeys.detail(id), patched);
        queryClient.setQueriesData<Employee[]>(
          { predicate: isEmployeeListCache },
          (old) => old?.map((e) => (e.id === id ? patched : e))
        );
      } else {
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        queryClient.invalidateQueries({ predicate: isEmployeeListCache });
      }

      const displayName =
        (data && typeof data.id === 'number'
          ? data.name
          : cachedDetail?.name) || 'Employee';
      toast.success('Employee Updated', {
        description: `${displayName}'s information has been updated.`,
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
 * Backend: `DELETE /employee/web/{id} → ApiResponse` (ack).
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeService.delete(id),
    onSuccess: (_, id) => {
      // Evict detail + filter from list caches.
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      queryClient.setQueriesData<Employee[]>(
        { predicate: isEmployeeListCache },
        (old) => old?.filter((e) => e.id !== id)
      );
      // Cross-namespace: user.defaultOrganizationId or user.attachments may
      // change if the deleted employee was the user's own. Invalidate
      // userKeys.all conservatively.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
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
 * Backend: `POST /employee/web/joinOrganization/userId/{userId}/organizationId/{orgId} → EmployeeDto` (full).
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
    onSuccess: (newEmployee) => {
      // Seed detail + predicate-append to list caches.
      queryClient.setQueryData(
        employeeKeys.detail(newEmployee.id),
        newEmployee
      );
      queryClient.setQueryData<Employee[]>(employeeKeys.lists(), (old) =>
        old ? [...old, newEmployee] : [newEmployee]
      );
      // Cross-namespace: the joining user gains an employee profile + may
      // need defaultOrganizationId updated. Organization gains a member.
      // Invalidate both for canonical refetch.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.employees() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success('Joined Organization', {
        description: `Successfully joined as ${newEmployee.designation || 'employee'}.`,
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
 * Backend: `PUT /employee/web/employeeId/{employeeId}/managerId/{managerId} → EmployeeDto` (full).
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
    onSuccess: (employee, { employeeId, managerId }) => {
      // Patch detail + predicate-replace lists.
      queryClient.setQueryData(employeeKeys.detail(employeeId), employee);
      queryClient.setQueriesData<Employee[]>(
        { predicate: isEmployeeListCache },
        (old) => old?.map((e) => (e.id === employeeId ? employee : e))
      );
      // The new manager's subordinates list now includes this employee.
      // Invalidate to refetch (we don't have the previous managerId to
      // remove from the old subordinates list).
      queryClient.invalidateQueries({
        queryKey: employeeKeys.subordinates(managerId),
      });
      // Also invalidate any other subordinates lists (predicate scan) —
      // safety net for the previous manager.
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'employees' &&
          q.queryKey[1] === 'subordinates',
      });
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
 * Backend: `DELETE /employee/web/employeeId/{employeeId}/manager → EmployeeDto` (full).
 */
export function useRemoveManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) =>
      employeeService.removeManager(employeeId),
    onSuccess: (employee, employeeId) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), employee);
      queryClient.setQueriesData<Employee[]>(
        { predicate: isEmployeeListCache },
        (old) => old?.map((e) => (e.id === employeeId ? employee : e))
      );
      // Invalidate all subordinates lists (the employee was removed from
      // their previous manager's list, but we don't know which one).
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'employees' &&
          q.queryKey[1] === 'subordinates',
      });
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
