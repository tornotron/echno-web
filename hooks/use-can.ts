'use client';

import { useCurrentUserAccess } from '@tornotron/echno-core/access/hooks';
import { useEmployeeRoles } from '@tornotron/echno-core/employee/hooks';
import { can } from '@/nav/access/evaluate';
import type { AccessConfig } from '@/nav/access/roles';

/**
 * Evaluates a gate from `nav/access/roles` against the signed-in employee's
 * `orgRoles` and, for a `matrixPermission` gate, their access on the access
 * matrix, for a page or a button that mirrors a backend `@PreAuthorize`.
 *
 * `allowed` is false while what the gate reads is loading, because the gate
 * fails closed on unknown roles and access; read `isLoading` first and hold the page so
 * a permitted reader does not see a flash of "Access Denied".
 */
export function useCan(config: AccessConfig): {
  allowed: boolean;
  isLoading: boolean;
} {
  const { orgRoles, isLoading: rolesLoading } = useEmployeeRoles();
  const { access, isLoading: accessLoading } = useCurrentUserAccess();
  return {
    allowed: can(config, orgRoles, access),
    isLoading: rolesLoading || (!!config.matrixPermission && accessLoading),
  };
}
