import { useEmployees } from '@/hooks/employee';
import { OrgRole } from '@/types/employee/org-role';

/**
 * Hook to read the current org roles for a specific employee.
 *
 * Derives role data from the shared employees cache so no additional
 * network request is required when employees are already loaded.
 *
 * @param {number} employeeId - The employee's numeric id.
 *
 * @example
 * ```tsx
 * const { currentRoles, availableRoles, isLoading } = useRoleManagement(employee.id);
 * ```
 */
export function useRoleManagement(employeeId: number) {
  const { data: employees, isLoading } = useEmployees();
  const employee = employees?.find((e) => e.id === employeeId);
  const currentRoles: OrgRole[] = employee?.orgRoles ?? [];

  const availableRoles = Object.values(OrgRole).filter(
    (role) => !currentRoles.includes(role)
  );

  return {
    currentRoles,
    availableRoles,
    employee,
    isLoading,
  };
}
