/**
 * hooks/employee/employee-keys.ts
 *
 * React Query key factory for the Employee domain.
 *
 * Note: `detail(id)` uses the canonical `['employees', 'detail', id]` shape
 * (Milestone 1B convention). The previous `['employees', id]` shape was
 * migrated during Milestone 7; UserPrefetcher and any other inline cache
 * writers have been updated to use the factory.
 */

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
  subordinates: (managerId?: number) =>
    [...employeeKeys.all, 'subordinates', managerId] as const,
  managers: () => [...employeeKeys.all, 'managers'] as const,
  managersByOrg: (organizationId: number) =>
    [...employeeKeys.all, 'managers', organizationId] as const,
};
