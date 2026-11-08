/**
 * Which roles an invitation can give on one project. While the old role checks
 * run, a role with a counterpart among the old roles holds across the
 * organization only, and the backend refuses a project on it. These pin the
 * form's side: such a role is never sent with a project, the baseline role is
 * never offered, and the backend's refusal is recognised.
 */
import { describe, expect, test } from 'bun:test';
import { ApiError } from '@tornotron/echno-core';
import type { AccessRole } from '@tornotron/echno-core/access/types';
import {
  invitableRoles,
  isProjectRefusal,
  refusesProject,
  toInvitationRoles,
} from './role-project-rule';

const role = (slug: string, extra: Partial<AccessRole> = {}): AccessRole => ({
  id: `id-${slug}`,
  slug,
  name: slug,
  system: false,
  baseline: false,
  grants: [],
  memberIds: [],
  grantableRoleIds: [],
  ...extra,
});

describe('refusesProject', () => {
  test('a role with an old counterpart holds across the organization', () => {
    for (const slug of [
      'system-admin',
      'project-manager',
      'site-engineer',
      'hr-admin',
    ]) {
      expect(refusesProject(role(slug))).toBe(true);
    }
  });

  test('a role without one takes a project', () => {
    for (const slug of [
      'management-director',
      'finance-manager',
      'client-owner',
      'my-custom-role',
    ]) {
      expect(refusesProject(role(slug))).toBe(false);
    }
  });
});

describe('invitableRoles', () => {
  test('leaves out the baseline role, which everyone holds', () => {
    const roles = [
      role('employee', { baseline: true, system: true }),
      role('site-engineer'),
    ];
    expect(invitableRoles(roles).map((r) => r.slug)).toEqual(['site-engineer']);
  });
});

describe('toInvitationRoles', () => {
  const roles = [role('site-engineer'), role('management-director')];

  test('sends a project only for a role that takes one', () => {
    expect(
      toInvitationRoles(
        [
          { roleId: 'id-site-engineer', projectId: 7 },
          { roleId: 'id-management-director', projectId: 7 },
        ],
        roles
      )
    ).toEqual([
      { roleId: 'id-site-engineer' },
      { roleId: 'id-management-director', projectId: 7 },
    ]);
  });

  test('a role across the organization sends no project', () => {
    expect(
      toInvitationRoles([{ roleId: 'id-management-director' }], roles)
    ).toEqual([{ roleId: 'id-management-director' }]);
  });

  test('drops a selection whose role is not in the list', () => {
    expect(toInvitationRoles([{ roleId: 'gone' }], roles)).toEqual([]);
  });
});

describe('isProjectRefusal', () => {
  test("recognises the backend's refusal of a project", () => {
    const error = new ApiError(
      "'site-engineer' holds across the organization until the old role checks are gone, so it cannot be given on one project",
      400
    );
    expect(isProjectRefusal(error)).toBe(true);
  });

  test('any other failure is not one', () => {
    expect(isProjectRefusal(new ApiError('Validation failed', 400))).toBe(
      false
    );
    expect(
      isProjectRefusal(new ApiError('cannot be given on one project', 500))
    ).toBe(false);
    expect(isProjectRefusal(new Error('cannot be given on one project'))).toBe(
      false
    );
  });
});
