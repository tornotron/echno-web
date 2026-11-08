/**
 * The screen's rules for what it offers: only actions the backend enforces,
 * only scopes the area filters by, only what the caller holds, and never a
 * change to System Admin, to a role the caller holds, or to the baseline
 * without its own permission. Whatever it does not offer is kept as held.
 */
import { describe, expect, test } from 'bun:test';
import {
  parseAccessCatalog,
  parseAccessRole,
  parseAccessUser,
  parseCurrentUserAccess,
} from '@tornotron/echno-core/access/types';
import {
  copyableGrants,
  mayAssign,
  mayChangeDetails,
  mayChangeGrants,
  mayOpenScreen,
  offeredActions,
  shownAreas,
  standingOf,
  toPermissionMap,
  withChosen,
  withScope,
} from './permissions';

const enforced = (...actions: string[]) =>
  actions.map((action) => ({ action, enforced: true }));

const catalog = parseAccessCatalog({
  sections: ['Projects', 'Setup'],
  scopes: ['ALL', 'ASSIGNED_PROJECTS', 'RELATED', 'OWN'],
  areas: [
    {
      id: 'assets',
      label: 'Assets',
      section: 'Projects',
      actions: [
        ...enforced('read', 'create', 'edit'),
        { action: 'approve', enforced: false },
      ],
      scopeAware: true,
    },
    {
      id: 'wbs',
      label: 'WBS',
      section: 'Projects',
      actions: [{ action: 'read', enforced: false }, ...enforced('edit')],
    },
    {
      id: 'finance',
      label: 'Finance',
      section: 'Projects',
      actions: [{ action: 'read', enforced: false }],
    },
    {
      id: 'access',
      label: 'Roles & Permissions',
      section: 'Setup',
      actions: enforced('read', 'edit'),
    },
  ],
});
const area = (id: string) => catalog.areas.find((a) => a.id === id)!;

const role = (over: Record<string, unknown>) =>
  parseAccessRole({
    slug: String(over.id),
    name: String(over.id),
    system: false,
    baseline: false,
    grants: [],
    assignments: [],
    grantableRoleIds: [],
    ...over,
  });

const member = role({ id: 'member', system: true, baseline: true });
const admin = role({
  id: 'admin',
  system: true,
  assignments: [{ employeeId: 1 }],
  grantableRoleIds: ['admin', 'pm', 'clerk'],
});
const pm = role({ id: 'pm', assignments: [{ employeeId: 2 }] });
const clerk = role({ id: 'clerk' });
const owner = role({ id: 'owner' });
const roles = [member, admin, pm, clerk, owner];

const users = [
  parseAccessUser({
    employeeId: 1,
    name: 'First Admin',
    active: true,
    roles: [{ roleId: 'admin' }, { roleId: 'pm', projectId: 7 }],
  }),
];

const accessOf = (grants: Record<string, string[]>) =>
  parseCurrentUserAccess({ organizationId: 5, employeeId: 1, grants });

const caller = accessOf({
  'access:read': ['ALL'],
  'access:edit': ['ALL'],
  'assets:read': ['ALL'],
  'assets:create': ['ALL'],
  'assets:edit': ['OWN'],
  'wbs:edit': ['ALL'],
});

describe('what the screen shows', () => {
  test('an area with no enforced action is left out', () => {
    expect(shownAreas(catalog).map((a) => a.id)).toEqual([
      'assets',
      'wbs',
      'access',
    ]);
  });

  test('of two scopes on one action, the wider is kept', () => {
    const map = toPermissionMap(
      [
        { permission: 'assets:read', scope: 'OWN' },
        { permission: 'assets:read', scope: 'ALL' },
      ],
      catalog.scopes
    );
    expect(map).toEqual({ assets: { read: 'ALL' } });
  });

  test('the tab shows on the current organization only, to a holder of access:read', () => {
    expect(mayOpenScreen(caller, 5)).toBe(true);
    expect(mayOpenScreen(caller, 6)).toBe(false);
    expect(mayOpenScreen(accessOf({ 'access:edit': ['ALL'] }), 5)).toBe(false);
    expect(mayOpenScreen(undefined, 5)).toBe(false);
  });
});

describe('the caller standing', () => {
  const standing = standingOf(caller, users, roles);

  test('holds the baseline and their own roles, and may assign what those list', () => {
    expect([...standing.held].toSorted()).toEqual(['admin', 'member', 'pm']);
    expect([...standing.assignable].toSorted()).toEqual([
      'admin',
      'clerk',
      'pm',
    ]);
    expect(standing.canEdit).toBe(true);
    expect(standing.canEditBaseline).toBe(false);
  });

  test('System Admin is never changed, a held role neither, an assignable one is', () => {
    expect(mayChangeGrants(admin, standing)).toBe(false);
    expect(mayChangeGrants(pm, standing)).toBe(false);
    expect(mayChangeGrants(clerk, standing)).toBe(true);
    expect(mayChangeGrants(owner, standing)).toBe(false);
  });

  test('the baseline changes only with access:edit-employee-role, and never takes access', () => {
    expect(mayChangeGrants(member, standing)).toBe(false);
    const baselineEditor = standingOf(
      accessOf({
        'access:edit': ['ALL'],
        'access:edit-employee-role': ['ALL'],
        'access:read': ['ALL'],
      }),
      users,
      roles
    );
    expect(mayChangeGrants(member, baselineEditor)).toBe(true);
    expect(mayChangeDetails(member, baselineEditor)).toBe(false);
    expect(offeredActions(member, area('access'), baselineEditor)).toEqual([]);
    expect(offeredActions(member, area('assets'), baselineEditor)).toEqual([]);
  });

  test('offers only enforced actions the caller holds across the organization', () => {
    // assets:approve is not enforced; assets:edit is held on OWN only.
    expect(offeredActions(clerk, area('assets'), standing)).toEqual([
      'read',
      'create',
    ]);
    expect(offeredActions(clerk, area('wbs'), standing)).toEqual(['edit']);
  });

  test('assigning needs access:edit and a role the caller may assign, never the baseline', () => {
    expect(mayAssign(admin, standing)).toBe(true);
    expect(mayAssign(owner, standing)).toBe(false);
    expect(mayAssign(member, standing)).toBe(false);
    const reader = standingOf(
      accessOf({ 'access:read': ['ALL'] }),
      users,
      roles
    );
    expect(mayAssign(clerk, reader)).toBe(false);
    expect(mayChangeGrants(clerk, reader)).toBe(false);
  });
});

describe('editing a cell', () => {
  const offered = ['read', 'create'];

  test('keeps what is not offered, and brings read with any action', () => {
    const cell = { approve: 'ALL', edit: 'OWN' };
    expect(withChosen(area('assets'), cell, ['create'], offered)).toEqual({
      approve: 'ALL',
      edit: 'OWN',
      read: 'ALL',
      create: 'ALL',
    });
  });

  test('a new action takes the scope the offered actions already have', () => {
    const cell = { read: 'OWN' };
    expect(
      withChosen(area('assets'), cell, ['read', 'create'], offered)
    ).toEqual({
      read: 'OWN',
      create: 'OWN',
    });
  });

  test('clearing takes off only what is offered', () => {
    expect(
      withChosen(area('assets'), { read: 'ALL', edit: 'ALL' }, [], offered)
    ).toEqual({ edit: 'ALL' });
  });

  test('a scope applies to the offered actions only', () => {
    expect(
      withScope({ read: 'ALL', create: 'ALL', edit: 'OWN' }, offered, 'RELATED')
    ).toEqual({ read: 'RELATED', create: 'RELATED', edit: 'OWN' });
  });

  test('read is not added where it is not enforced', () => {
    expect(withChosen(area('wbs'), undefined, ['edit'], ['edit'])).toEqual({
      edit: 'ALL',
    });
  });
});

describe('a copy of a role', () => {
  test('starts with only the grants the backend would add for the caller', () => {
    const standing = standingOf(caller, users, roles);
    const grants = copyableGrants(
      [
        { permission: 'assets:read', scope: 'OWN' },
        { permission: 'assets:edit', scope: 'ALL' },
        { permission: 'assets:approve', scope: 'ALL' },
        { permission: 'wbs:edit', scope: 'OWN' },
        { permission: 'wbs:edit', scope: 'ALL' },
        { permission: 'gone:read', scope: 'ALL' },
      ],
      catalog,
      standing
    );
    expect(grants).toEqual([
      { permission: 'assets:read', scope: 'OWN' },
      { permission: 'wbs:edit', scope: 'ALL' },
    ]);
  });
});
