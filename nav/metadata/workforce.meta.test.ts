import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { canAccess } from '../access/evaluate';
import { workforceMetadata } from './workforce.meta';

/**
 * `GET /employee/web` and `/employee/web/paginated` admit system-admin,
 * hr-admin and project-manager only (`EmployeeControllerWeb`). The Employees
 * menu item was shown to everyone, so other roles opened a page that could
 * only fail with a 403.
 */
function ctx(orgRoles: string[]) {
  return { isAuthenticated: true, orgRoles };
}

describe('Employees menu item follows the employee list gate', () => {
  const item = workforceMetadata['workforce-employees'];

  test('names exactly the roles the backend admits', () => {
    expect(item.access?.allowOrgRoles).toEqual([
      OrgRole.SYSTEM_ADMIN,
      OrgRole.HR_ADMIN,
      OrgRole.PROJECT_MANAGER,
    ]);
  });

  test('is locked for a role the backend refuses', () => {
    expect(canAccess(item.access ?? {}, ctx([OrgRole.HR_ADMIN]))).toBe(true);
    expect(canAccess(item.access ?? {}, ctx([OrgRole.SITE_ENGINEER]))).toBe(
      false
    );
    expect(canAccess(item.access ?? {}, ctx([OrgRole.DIRECTOR]))).toBe(false);
  });
});
