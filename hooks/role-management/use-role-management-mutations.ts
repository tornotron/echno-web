import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleManagementService } from '@/services/role-management-service';
import { OrgRole, getOrgRoleLabel } from '@/types/employee/org-role';
import { toast } from '@/lib/styles/toast-styles';

/**
 * Hook to assign an organization role to an employee.
 * Invalidates the employees cache on success so the roles list refreshes.
 *
 * @example
 * ```tsx
 * const assignRole = useAssignRole();
 * assignRole.mutate({ employeeId: 42, orgRole: OrgRole.PROJECT_MANAGER });
 * ```
 */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      orgRole,
    }: {
      employeeId: number;
      orgRole: OrgRole;
    }) => roleManagementService.assignRole(employeeId, orgRole),
    onSuccess: (_, { employeeId, orgRole }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Role Assigned', {
        description: `${getOrgRoleLabel(orgRole)} has been assigned successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to assign role', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to unassign an organization role from an employee.
 * Invalidates the employees cache on success so the roles list refreshes.
 *
 * @example
 * ```tsx
 * const unassignRole = useUnassignRole();
 * unassignRole.mutate({ employeeId: 42, orgRole: OrgRole.PROJECT_MANAGER });
 * ```
 */
export function useUnassignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      orgRole,
    }: {
      employeeId: number;
      orgRole: OrgRole;
    }) => roleManagementService.unassignRole(employeeId, orgRole),
    onSuccess: (_, { employeeId, orgRole }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Role Removed', {
        description: `${getOrgRoleLabel(orgRole)} has been removed successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to remove role', {
        description: error.message,
      });
    },
  });
}
