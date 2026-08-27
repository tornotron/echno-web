import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  ASSIGNABLE_ORG_ROLES,
  assignableOrgRoles,
  isAssignableOrgRole,
} from './assignable-org-roles';

describe('assignableOrgRoles', () => {
  test('drops job-family roles the assign endpoint has no group for', () => {
    const offered = [
      OrgRole.SITE_MANAGER,
      OrgRole.MASON,
      OrgRole.PROJECT_MANAGER,
      OrgRole.SAFETY_OFFICER,
    ];

    expect(assignableOrgRoles(offered)).toEqual([OrgRole.PROJECT_MANAGER]);
  });

  test('keeps every role the backend accepts', () => {
    expect(assignableOrgRoles([...ASSIGNABLE_ORG_ROLES])).toEqual([
      ...ASSIGNABLE_ORG_ROLES,
    ]);
  });

  test('lists roles in a fixed order, not the order they were offered', () => {
    const reversed = [...ASSIGNABLE_ORG_ROLES].toReversed();

    expect(assignableOrgRoles(reversed)).toEqual([...ASSIGNABLE_ORG_ROLES]);
  });

  test('returns nothing when the employee already holds every assignable role', () => {
    expect(assignableOrgRoles([OrgRole.MASON, OrgRole.WELDER])).toEqual([]);
    expect(assignableOrgRoles([])).toEqual([]);
  });
});

describe('isAssignableOrgRole', () => {
  test('SITE_MANAGER is not assignable, which is the reported bug', () => {
    expect(isAssignableOrgRole(OrgRole.SITE_MANAGER)).toBe(false);
  });

  test('the Keycloak organisation roles are assignable', () => {
    expect(isAssignableOrgRole(OrgRole.SYSTEM_ADMIN)).toBe(true);
    expect(isAssignableOrgRole(OrgRole.HR_ADMIN)).toBe(true);
    expect(isAssignableOrgRole(OrgRole.PROJECT_MANAGER)).toBe(true);
  });
});
