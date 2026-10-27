import { describe, expect, test } from 'bun:test';
import {
  normalizeActions,
  resolveEffectiveAccess,
  type AccessGroup,
  type AccessRole,
} from '@/types/access-control';

const role = (over: Partial<AccessRole>): AccessRole => ({
  id: 1,
  name: 'Role',
  description: '',
  isSystem: false,
  permissions: {},
  userIds: [],
  ...over,
});

const group = (over: Partial<AccessGroup>): AccessGroup => ({
  id: 1,
  name: 'Group',
  description: '',
  kind: 'group',
  permissions: {},
  roleIds: [],
  userIds: [],
  ...over,
});

describe('normalizeActions', () => {
  test('adds view to any other action, dedupes and orders', () => {
    expect(normalizeActions(['delete', 'create', 'delete'])).toEqual([
      'view',
      'create',
      'delete',
    ]);
    expect(normalizeActions([])).toEqual([]);
  });
});

describe('resolveEffectiveAccess', () => {
  test('unions the actions from direct grants, roles and groups', () => {
    const roles = [
      role({
        id: 1,
        name: 'PM',
        userIds: [7],
        permissions: { finance: ['view'], wbs: ['view', 'edit'] },
      }),
    ];
    const groups = [
      group({
        id: 1,
        name: 'Auditors',
        userIds: [7],
        permissions: { finance: ['view', 'create'] },
      }),
    ];
    const access = resolveEffectiveAccess(
      7,
      { permissions: { wbs: ['delete'] } },
      roles,
      groups
    );

    expect(access.finance.actions).toEqual(['view', 'create']);
    expect(access.finance.sources.map((s) => s.name)).toEqual([
      'PM',
      'Auditors',
    ]);
    // Create was granted by nobody: delete does not imply it.
    expect(access.wbs.actions).toEqual(['view', 'edit', 'delete']);
    expect(access.dashboard).toEqual({ actions: [], sources: [] });
  });

  test("a group that lists one of the user's roles covers the user", () => {
    const roles = [role({ id: 3, userIds: [7] })];
    const groups = [
      group({
        name: 'Engineering',
        roleIds: [3],
        permissions: { documents: ['view'] },
      }),
    ];
    expect(
      resolveEffectiveAccess(7, undefined, roles, groups).documents.actions
    ).toEqual(['view']);
    expect(
      resolveEffectiveAccess(8, undefined, roles, groups).documents.actions
    ).toEqual([]);
  });

  test('an empty grant adds no source', () => {
    const roles = [role({ userIds: [7], permissions: { finance: [] } })];
    const access = resolveEffectiveAccess(
      7,
      { permissions: { finance: [] } },
      roles,
      []
    );
    expect(access.finance.sources).toEqual([]);
  });
});
