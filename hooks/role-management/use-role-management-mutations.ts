import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleManagementService } from '@/services/role-management-service';
import { Employee } from '@/types/employee';
import { OrgRole, getOrgRoleLabel } from '@/types/employee/org-role';
import { toast } from '@/lib/styles/toast-styles';
import { employeeKeys } from '@/hooks/employee/employee-keys';

/**
 * Matches every Employee[] list cache under the 'employees' namespace.
 * Mirrors the predicate in `use-employee-mutations.ts`; kept inline here
 * because cross-importing from a sibling mutation file would couple the
 * modules unnecessarily.
 */
function isEmployeeListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return Array.isArray(key) && key[0] === 'employees' && key[1] !== 'detail';
}

/**
 * Hook to assign an organization role to an employee.
 *
 * Backend: `POST /keycloakGroup/web/assignRole → ApiResponse` (ack).
 * Service returns `Promise<void>`, so we patch the cached employee's
 * `orgRoles` array directly using the request parameters. Mirrors the
 * `useRoleManagement` consumer which reads roles from the employees list
 * cache via `employee.orgRoles`.
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
    onSuccess: (_data, { employeeId, orgRole }) => {
      // Patch the cached employee's orgRoles array — append if not already
      // present. Detail cache.
      queryClient.setQueryData<Employee>(
        employeeKeys.detail(employeeId),
        (old) =>
          old
            ? {
                ...old,
                orgRoles: old.orgRoles?.includes(orgRole)
                  ? old.orgRoles
                  : [...(old.orgRoles ?? []), orgRole],
              }
            : old
      );
      // Mirror across every Employee[] list cache.
      queryClient.setQueriesData<Employee[]>(
        { predicate: isEmployeeListCache },
        (old) =>
          old?.map((e) =>
            e.id === employeeId
              ? {
                  ...e,
                  orgRoles: e.orgRoles?.includes(orgRole)
                    ? e.orgRoles
                    : [...(e.orgRoles ?? []), orgRole],
                }
              : e
          )
      );
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
 *
 * Backend: `POST /keycloakGroup/web/unassignRole → ApiResponse` (ack).
 * Service returns `Promise<void>`. Filter the cached employee's `orgRoles`
 * array directly.
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
    onSuccess: (_data, { employeeId, orgRole }) => {
      // Filter the role from the cached employee's orgRoles array.
      queryClient.setQueryData<Employee>(
        employeeKeys.detail(employeeId),
        (old) =>
          old
            ? {
                ...old,
                orgRoles: (old.orgRoles ?? []).filter((r) => r !== orgRole),
              }
            : old
      );
      queryClient.setQueriesData<Employee[]>(
        { predicate: isEmployeeListCache },
        (old) =>
          old?.map((e) =>
            e.id === employeeId
              ? {
                  ...e,
                  orgRoles: (e.orgRoles ?? []).filter((r) => r !== orgRole),
                }
              : e
          )
      );
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
