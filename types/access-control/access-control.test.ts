import { describe, expect, test } from 'bun:test';
import {
  assignableRoleIds,
  cellActions,
  cellScope,
  lockedActions,
  mayChangeRole,
  normalizeActions,
  resolveEffectiveAccess,
  rolesOf,
  samePermissions,
  toGrantRequests,
  toPermissionMap,
  withActions,
  withScope,
  type AccessArea,
  type AccessGroup,
  type AccessRole,
} from '@/types/access-control';

const SCOPES = ['ALL', 'ASSIGNED_PROJECTS', 'RELATED', 'OWN'];
const STANDARD = ['view', 'create', 'edit', 'approve', 'delete'];
const assets: AccessArea = {
  id: 'assets',
  label: 'Assets',
  section: 'Stores',
  actions: STANDARD,
};
const bills: AccessArea = {
  id: 'progress-bills',
  label: 'Progress Bills',
  section: 'Bills',
  actions: [...STANDARD, 'prepare', 'certify'],
};

const role = (over: Partial<AccessRole>): AccessRole => ({
  id: 'r',
  slug: 'r',
  name: 'Role',
  system: false,
  baseline: false,
  grants: [],
  memberIds: [],
  grantableRoleIds: [],
  ...over,
});

const group = (over: Partial<AccessGroup>): AccessGroup => ({
  id: 'g',
  name: 'Group',
  kind: 'GROUP',
  grants: [],
  memberIds: [],
  roleIds: [],
  ...over,
});

const grant = (permission: string, scope = 'ALL', locked = false) => ({
  permission,
  scope,
  locked,
});

describe('cells', () => {
  test('groups grants by area and writes them back unchanged', () => {
    const grants = [
      grant('assets:view'),
      grant('assets:create'),
      grant('leave:view', 'OWN'),
    ];
    const map = toPermissionMap(grants, SCOPES);
    expect(map).toEqual({
      assets: { view: 'ALL', create: 'ALL' },
      leave: { view: 'OWN' },
    });
    expect(toGrantRequests(map)).toEqual(
      grants.map(({ permission, scope }) => ({ permission, scope }))
    );
  });

  test('keeps the wider scope of an action held twice', () => {
    const map = toPermissionMap(
      [grant('assets:view', 'OWN'), grant('assets:view', 'ALL')],
      SCOPES
    );
    expect(map.assets).toEqual({ view: 'ALL' });
  });

  test('reads a cell as one scope, or mixed', () => {
    expect(cellScope({ view: 'OWN', create: 'OWN' })).toBe('OWN');
    expect(cellScope({ view: 'ALL', create: 'OWN' })).toBe('MIXED');
    expect(cellScope({})).toBeUndefined();
  });

  test("lists a cell's actions in the area's order, named actions too", () => {
    expect(
      cellActions(bills, { certify: 'ALL', view: 'ALL', create: 'ALL' })
    ).toEqual(['view', 'create', 'certify']);
  });

  test('adds view to any other action, in the area order', () => {
    expect(normalizeActions(assets, ['delete', 'create'])).toEqual([
      'view',
      'create',
      'delete',
    ]);
    expect(normalizeActions(assets, [])).toEqual([]);
  });

  test('a new action takes the cell scope; a held one keeps its own', () => {
    const cell = { view: 'ASSIGNED_PROJECTS' };
    expect(withActions(assets, cell, ['view', 'edit'])).toEqual({
      view: 'ASSIGNED_PROJECTS',
      edit: 'ASSIGNED_PROJECTS',
    });
    expect(withActions(assets, undefined, ['create'], 'OWN')).toEqual({
      view: 'OWN',
      create: 'OWN',
    });
    expect(withScope({ view: 'ALL', edit: 'OWN' }, 'RELATED')).toEqual({
      view: 'RELATED',
      edit: 'RELATED',
    });
  });

  test('compares maps by what they hold, not by key order', () => {
    expect(
      samePermissions(
        { assets: { view: 'ALL', create: 'ALL' } },
        { assets: { create: 'ALL', view: 'ALL' } }
      )
    ).toBe(true);
    expect(
      samePermissions({ assets: { view: 'ALL' } }, { assets: { view: 'OWN' } })
    ).toBe(false);
  });

  test('lists locked actions by area', () => {
    expect(
      lockedActions([
        grant('leave:view', 'OWN', true),
        grant('leave:create', 'OWN', true),
        grant('assets:view'),
      ])
    ).toEqual({ leave: ['view', 'create'] });
  });
});

describe('what a person holds', () => {
  const member = role({
    id: 'member',
    name: 'Member',
    baseline: true,
    grants: [grant('assets:view')],
    grantableRoleIds: [],
  });
  const clerk = role({
    id: 'clerk',
    name: 'Asset Clerk',
    grants: [grant('assets:create')],
  });
  const pm = role({
    id: 'pm',
    name: 'Project Manager',
    grants: [grant('assets:delete')],
    grantableRoleIds: ['clerk'],
  });
  const stores = group({
    id: 'stores',
    name: 'Stores',
    roleIds: ['clerk'],
    grants: [grant('assets:edit')],
    memberIds: [3],
  });
  const roles = [member, clerk, pm];

  test("everyone holds the baseline; a group's members hold its roles", () => {
    expect(
      rolesOf({ roleIds: [], groupIds: ['stores'] }, roles, [stores]).map(
        (r) => r.id
      )
    ).toEqual(['member', 'clerk']);
  });

  test('adds up the baseline, roles from groups, group grants and their own', () => {
    const access = resolveEffectiveAccess(
      {
        roleIds: [],
        groupIds: ['stores'],
        grants: [grant('assets:approve')],
      },
      [assets],
      roles,
      [stores]
    );
    expect(access.assets.actions).toEqual([
      'view',
      'create',
      'edit',
      'approve',
    ]);
    expect(access.assets.sources.map((s) => s.name)).toEqual([
      'Direct',
      'Member',
      'Asset Clerk',
      'Stores',
    ]);
  });

  test('leaves out their own grants when none are passed', () => {
    const access = resolveEffectiveAccess(
      { roleIds: ['pm'], groupIds: [] },
      [assets],
      roles,
      []
    );
    expect(access.assets.sources.map((s) => s.kind)).toEqual(['role', 'role']);
  });

  test('the caller may change the baseline and the roles their roles may assign', () => {
    const assignable = assignableRoleIds(
      { roleIds: ['pm'], groupIds: [] },
      roles,
      []
    );
    expect([...assignable]).toEqual(['clerk']);
    expect(mayChangeRole(member, assignable)).toBe(true);
    expect(mayChangeRole(clerk, assignable)).toBe(true);
    expect(mayChangeRole(pm, assignable)).toBe(false);
  });
});
