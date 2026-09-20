'use client';

import { useEmployeeRoles } from '@tornotron/echno-core/employee/hooks';
import { can } from '@/nav/access/evaluate';
import type { AccessConfig } from '@/nav/access/roles';

/**
 * Evaluates an org-role gate from `nav/access/roles` against the signed-in
 * employee's `orgRoles`, for a page or a button that mirrors a backend
 * `@PreAuthorize`.
 *
 * `allowed` is false while the employee record is loading, because the gate
 * fails closed on unknown roles; read `isLoading` first and hold the page so
 * a permitted reader does not see a flash of "Access Denied".
 */
export function useCan(config: AccessConfig): {
  allowed: boolean;
  isLoading: boolean;
} {
  const { orgRoles, isLoading } = useEmployeeRoles();
  return { allowed: can(config, orgRoles), isLoading };
}
