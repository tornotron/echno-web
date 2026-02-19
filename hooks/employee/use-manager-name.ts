import { useMemo } from 'react';
import { useEmployees } from './use-employee';

/**
 * Hook to resolve a manager's name from their ID.
 * Looks up the manager in the organization's employee list.
 *
 * @param managerId - The manager's employee ID
 * @returns Manager name or undefined if not found
 *
 * @example
 * ```tsx
 * const managerName = useManagerName(invitation.employeeDetails.managerId);
 * // Returns: "Rohan Kapoor" or undefined
 * ```
 */
export function useManagerName(managerId?: number): string | undefined {
  const { data: employees } = useEmployees();

  const managerName = useMemo(() => {
    if (!managerId || !employees) {
      return;
    }

    const manager = employees.find((emp) => emp.id === managerId);
    return manager?.name;
  }, [managerId, employees]);

  return managerName;
}

/**
 * Hook to resolve multiple manager names at once.
 * Useful for lists of invitations or employees.
 *
 * @param managerIds - Array of manager IDs to resolve
 * @returns Map of managerId to manager name
 *
 * @example
 * ```tsx
 * const managerNames = useManagerNames([1, 2, 5]);
 * // Returns: { 1: "John Doe", 2: "Jane Smith", 5: "Bob Wilson" }
 * ```
 */
export function useManagerNames(
  managerIds: (number | undefined)[]
): Record<number, string> {
  const { data: employees } = useEmployees();

  const managerNamesMap = useMemo(() => {
    if (!employees || managerIds.length === 0) {
      return {};
    }

    const map: Record<number, string> = {};

    for (const managerId of managerIds) {
      if (managerId) {
        const manager = employees.find((emp) => emp.id === managerId);
        if (manager) {
          map[managerId] = manager.name;
        }
      }
    }

    return map;
  }, [managerIds, employees]);

  return managerNamesMap;
}
