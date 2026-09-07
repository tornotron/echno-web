import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  ASSIGNABLE_ORG_ROLES,
  BACKEND_ORG_ROLES,
  ORG_ROLE_POLICY,
  assignableOrgRoles,
  isAssignableOrgRole,
  withheldReason,
} from './assignable-org-roles';

// This is the test the file exists for. The offered list was hardcoded once and
// then sat unchanged while the backend grew from four org roles to eight, so a
// role that existed in the backend, in the API document and in echno-core could
// not be granted from the console at all. The list is now derived from the
// mirror of the backend enum through a policy record that is total over it, so
// a role added to the mirror and left undecided fails here and does not compile
// either. That is the only way the same gap can open again.
describe('every backend org role is accounted for', () => {
  test('a backend role added to the mirror has a policy of its own', () => {
    const undecided = BACKEND_ORG_ROLES.filter(
      (role) => ORG_ROLE_POLICY[role] === undefined
    );

    expect(undecided).toEqual([]);
  });

  test('a withheld role states why, rather than being quietly dropped', () => {
    for (const role of BACKEND_ORG_ROLES) {
      const reason = withheldReason(role);
      if (reason === undefined) continue;

      expect(reason.length, `${role} needs a reason worth reading`).toBeGreaterThan(40);
    }
  });

  test('the offered list is exactly the roles whose policy says to offer them', () => {
    expect([...ASSIGNABLE_ORG_ROLES]).toEqual(
      BACKEND_ORG_ROLES.filter((role) => ORG_ROLE_POLICY[role] === 'offer').map(
        (role) => role as OrgRole
      )
    );
  });

  test('nothing is offered that the backend would not parse', () => {
    const backend = new Set<string>(BACKEND_ORG_ROLES);

    expect(ASSIGNABLE_ORG_ROLES.filter((role) => !backend.has(role))).toEqual([]);
  });
});

describe('the roles the dialog offers', () => {
  // Named as the wire string on purpose. Written as OrgRole.STORE_KEEPER this
  // passes against an echno-core that has no such member, because the missing
  // member is undefined on both sides of the comparison.
  test('store-keeper can be granted, which is what issue #422 reported', () => {
    expect(assignableOrgRoles([])).toContain('STORE_KEEPER' as OrgRole);
  });

  test('the inspection roles the backend accepts can be granted', () => {
    const offered = assignableOrgRoles([]);

    expect(offered).toContain('SAFETY_OFFICER' as OrgRole);
    expect(offered).toContain('SITE_ENGINEER' as OrgRole);
  });

  test('org-manager is withheld, because nothing reads the authority it grants', () => {
    expect(assignableOrgRoles([])).not.toContain('ORG_MANAGER' as OrgRole);
    expect(withheldReason('ORG_MANAGER')).toBeDefined();
  });

  test('qa-engineer is withheld until echno-core can name it', () => {
    expect(assignableOrgRoles([])).not.toContain('QA_ENGINEER' as OrgRole);
    expect(withheldReason('QA_ENGINEER')).toBeDefined();
  });
});

describe('assignableOrgRoles', () => {
  test('drops the roles the employee already holds', () => {
    const offered = assignableOrgRoles([
      OrgRole.PROJECT_MANAGER,
      'STORE_KEEPER' as OrgRole,
    ]);

    expect(offered).not.toContain(OrgRole.PROJECT_MANAGER);
    expect(offered).not.toContain('STORE_KEEPER' as OrgRole);
    expect(offered).toContain(OrgRole.SYSTEM_ADMIN);
  });

  test('ignores job-family roles, which are not organisation roles at all', () => {
    expect(assignableOrgRoles([OrgRole.MASON, OrgRole.WELDER])).toEqual([
      ...ASSIGNABLE_ORG_ROLES,
    ]);
  });

  test('offers everything to an employee holding nothing', () => {
    expect(assignableOrgRoles([])).toEqual([...ASSIGNABLE_ORG_ROLES]);
  });

  test('returns nothing once the employee holds every assignable role', () => {
    expect(assignableOrgRoles([...ASSIGNABLE_ORG_ROLES])).toEqual([]);
  });

  test('lists roles in a fixed order, not the order they were passed', () => {
    const held = ASSIGNABLE_ORG_ROLES.slice(1);

    expect(assignableOrgRoles([...held].toReversed())).toEqual([
      ASSIGNABLE_ORG_ROLES[0],
    ]);
  });
});

describe('isAssignableOrgRole', () => {
  test('SITE_MANAGER is not assignable: it is a job family, not a Keycloak group', () => {
    expect(isAssignableOrgRole(OrgRole.SITE_MANAGER)).toBe(false);
  });

  test('the Keycloak organisation roles are assignable', () => {
    expect(isAssignableOrgRole(OrgRole.SYSTEM_ADMIN)).toBe(true);
    expect(isAssignableOrgRole(OrgRole.HR_ADMIN)).toBe(true);
    expect(isAssignableOrgRole(OrgRole.PROJECT_MANAGER)).toBe(true);
    expect(isAssignableOrgRole('STORE_KEEPER' as OrgRole)).toBe(true);
  });
});
