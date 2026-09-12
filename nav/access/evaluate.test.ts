import { describe, expect, test } from 'bun:test';
import {
  canAccess,
  filterNavByAccess,
  isModuleVisible,
  resolveSidebarAccess,
  type AccessContext,
} from './evaluate';
import { OPEN_ACCESS, STORES_ACCESS } from './roles';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import type { ComposedNavItem } from '../types';

function item(overrides: Partial<ComposedNavItem>): ComposedNavItem {
  return {
    id: overrides.id ?? 'x',
    segment: 'x',
    path: '/x',
    isDynamic: false,
    isCatchAll: false,
    label: 'X',
    sidebarHidden: false,
    breadcrumbHidden: false,
    nonInteractive: false,
    hideWhenLocked: false,
    access: OPEN_ACCESS,
    children: [],
    ...overrides,
  };
}

const authed: AccessContext = { isAuthenticated: true };

const storeTree = () => [
  item({
    id: 'resources',
    nonInteractive: true,
    children: [
      item({ id: 'resources-assets' }),
      item({
        id: 'resources-goods-receipts',
        access: STORES_ACCESS,
        hideWhenLocked: true,
      }),
      item({
        id: 'resources-indents',
        access: STORES_ACCESS,
        hideWhenLocked: true,
      }),
    ],
  }),
];

const visibleIds = (ctx: AccessContext) =>
  resolveSidebarAccess(storeTree(), ctx)[0].children.map((c) => c.id);

describe('isModuleVisible', () => {
  test('a route with no moduleId is always visible', () => {
    expect(isModuleVisible(undefined, {})).toBe(true);
    expect(isModuleVisible(undefined, { enabledModules: new Set() })).toBe(
      true
    );
  });

  test('undefined enabledModules means "not gating" — visible regardless', () => {
    expect(isModuleVisible('inspections', {})).toBe(true);
  });

  test('a real enabled set gates: present passes, absent fails', () => {
    const ctx = { enabledModules: new Set(['inspections']) };
    expect(isModuleVisible('inspections', ctx)).toBe(true);
    expect(isModuleVisible('billing', ctx)).toBe(false);
  });
});

describe('filterNavByAccess — module gate', () => {
  test('an empty enabled set is a real answer: hides a module-tagged entry', () => {
    const tree = [
      item({ id: 'inspections', moduleId: 'inspections' }),
      item({ id: 'projects' }),
    ];
    const result = filterNavByAccess(tree, {
      ...authed,
      enabledModules: new Set(),
    });
    expect(result.map((i) => i.id)).toEqual(['projects']);
  });

  test('drops an item whose module is absent from the enabled set, subtree included', () => {
    const tree = [
      item({
        id: 'inspections',
        moduleId: 'inspections',
        children: [item({ id: 'inspections-ncr' })],
      }),
      item({ id: 'projects' }),
    ];
    const result = filterNavByAccess(tree, {
      ...authed,
      enabledModules: new Set(['billing']),
    });
    expect(result.map((i) => i.id)).toEqual(['projects']);
  });

  test('keeps an item whose module is present in the enabled set', () => {
    const tree = [item({ id: 'inspections', moduleId: 'inspections' })];
    const result = filterNavByAccess(tree, {
      ...authed,
      enabledModules: new Set(['inspections']),
    });
    expect(result.map((i) => i.id)).toEqual(['inspections']);
  });

  test('gates nothing when enabledModules is undefined (no-gating fallback)', () => {
    const tree = [item({ id: 'inspections', moduleId: 'inspections' })];
    expect(filterNavByAccess(tree, authed).map((i) => i.id)).toEqual([
      'inspections',
    ]);
  });
});

describe('resolveSidebarAccess — module gate', () => {
  test('drops a disabled module outright rather than marking it locked', () => {
    const tree = [
      item({
        id: 'inspections',
        moduleId: 'inspections',
        children: [item({ id: 'inspections-ncr' })],
      }),
    ];
    const result = resolveSidebarAccess(tree, {
      ...authed,
      enabledModules: new Set(),
    });
    expect(result).toHaveLength(0);
  });

  test('an enabled module still goes through the normal lock computation', () => {
    const tree = [
      item({
        id: 'inspections',
        moduleId: 'inspections',
        access: { permissions: ['inspections:view'] },
      }),
    ];
    const result = resolveSidebarAccess(tree, {
      ...authed,
      enabledModules: new Set(['inspections']),
      permissions: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].locked).toBe(true);
  });
});

describe('canAccess — permissions gate', () => {
  test('hides an item from a user without the required permission', () => {
    const config = { permissions: ['inspections:view'] } as const;
    expect(canAccess(config, { ...authed, permissions: [] })).toBe(false);
  });

  test('allows an item once the user holds every required permission', () => {
    const config = { permissions: ['inspections:view'] } as const;
    expect(
      canAccess(config, { ...authed, permissions: ['inspections:view'] })
    ).toBe(true);
  });
});

describe('canAccess org-role gate', () => {
  test('a reader holding only STORE_KEEPER passes, regardless of tier', () => {
    expect(
      canAccess(STORES_ACCESS, {
        ...authed,
        role: 'employee',
        orgRoles: [OrgRole.STORE_KEEPER],
      })
    ).toBe(true);
  });

  test('a plain employee with no org role is denied', () => {
    expect(
      canAccess(STORES_ACCESS, { ...authed, role: 'employee', orgRoles: [] })
    ).toBe(false);
  });

  test('an org role outside the list is denied even at admin tier', () => {
    expect(
      canAccess(STORES_ACCESS, {
        ...authed,
        role: 'admin',
        orgRoles: [OrgRole.DIRECTOR],
      })
    ).toBe(false);
  });

  test('SYSTEM_ADMIN and PROJECT_MANAGER pass', () => {
    expect(
      canAccess(STORES_ACCESS, { ...authed, orgRoles: [OrgRole.SYSTEM_ADMIN] })
    ).toBe(true);
    expect(
      canAccess(STORES_ACCESS, {
        ...authed,
        orgRoles: [OrgRole.LABORER, OrgRole.PROJECT_MANAGER],
      })
    ).toBe(true);
  });

  test('fails closed: undefined orgRoles is denied for an org-role-gated config', () => {
    expect(canAccess(STORES_ACCESS, authed)).toBe(false);
  });

  test('undefined orgRoles has no effect on a config with no org-role gate', () => {
    expect(canAccess(OPEN_ACCESS, authed)).toBe(true);
    expect(
      canAccess({ allowRoles: ['admin'] }, { ...authed, role: 'admin' })
    ).toBe(true);
  });

  test('allowOrgRoles is checked in addition to allowRoles, not instead', () => {
    const config = {
      allowRoles: ['admin'],
      allowOrgRoles: [OrgRole.STORE_KEEPER],
    } as const;
    expect(
      canAccess(config, {
        ...authed,
        role: 'employee',
        orgRoles: [OrgRole.STORE_KEEPER],
      })
    ).toBe(false);
    expect(
      canAccess(config, {
        ...authed,
        role: 'admin',
        orgRoles: [OrgRole.STORE_KEEPER],
      })
    ).toBe(true);
  });

  test('sidebar: a store-keeper sees the store entries under Resources', () => {
    expect(
      visibleIds({
        ...authed,
        role: 'employee',
        orgRoles: [OrgRole.STORE_KEEPER],
      })
    ).toEqual([
      'resources-assets',
      'resources-goods-receipts',
      'resources-indents',
    ]);
  });

  test('sidebar: a plain employee sees only the open entries, store ones hidden', () => {
    expect(visibleIds({ ...authed, role: 'employee', orgRoles: [] })).toEqual([
      'resources-assets',
    ]);
  });

  test('sidebar: a system-admin sees the store entries', () => {
    expect(
      visibleIds({ ...authed, role: 'admin', orgRoles: [OrgRole.SYSTEM_ADMIN] })
    ).toEqual([
      'resources-assets',
      'resources-goods-receipts',
      'resources-indents',
    ]);
  });

  test('sidebar: a caller that supplies no orgRoles never sees a store entry', () => {
    expect(visibleIds({ ...authed, role: 'admin' })).toEqual([
      'resources-assets',
    ]);
  });

  test('filterNavByAccess drops the store entries for a reader without the role', () => {
    const kept = filterNavByAccess(storeTree(), {
      ...authed,
      orgRoles: [OrgRole.SITE_ENGINEER],
    })[0].children.map((c) => c.id);
    expect(kept).toEqual(['resources-assets']);
  });
});
