import { describe, expect, test } from 'bun:test';
import {
  canAccess,
  filterNavByAccess,
  isModuleVisible,
  resolveSidebarAccess,
  type AccessContext,
} from './evaluate';
import { OPEN_ACCESS } from './roles';
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
