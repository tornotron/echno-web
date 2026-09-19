/**
 * The module contract, the nav metadata and the route layout describe one
 * module. Pinned so the three cannot drift: the same id, the same
 * permission string on the sidebar entry and the metadata gate, and a
 * `ModuleGuard` on the route segment, which is what keeps every page under
 * `/users/dashboard/toolbox-talks` dark for an organization without the
 * entitlement.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { getPermissionsForRole } from '@/nav/access/roles';
import { toolboxTalksMetadata } from '@/nav/metadata/toolbox-talks.meta';
import { toolboxTalksModule } from './module.config';

const layout = readFileSync(
  new URL(
    '../../app/users/dashboard/toolbox-talks/layout.tsx',
    import.meta.url
  ),
  'utf8'
);

describe('Toolbox Talks module wiring', () => {
  test('the entitlement key follows the module id', () => {
    expect(toolboxTalksModule.id).toBe('toolbox-talks');
    expect(toolboxTalksModule.entitlementFeatureKey).toBe(
      'MODULE_TOOLBOX_TALKS'
    );
  });

  test('the nav entry and the metadata gate on the same permission, in the inspections section', () => {
    const entry = toolboxTalksMetadata['toolbox-talks'];
    expect(entry.moduleId).toBe(toolboxTalksModule.id);
    expect(entry.section).toBe('inspections');
    expect(toolboxTalksModule.nav[0].section).toBe('inspections');
    expect(entry.access?.permissions).toEqual(
      toolboxTalksModule.nav[0].requiredPermissions
    );
    expect(entry.access?.permissions).toEqual(['toolbox-talks:read']);
    expect(toolboxTalksModule.nav[0].path).toBe(
      '/users/dashboard/toolbox-talks'
    );
  });

  test('the new, detail and edit segments stay out of the sidebar', () => {
    for (const key of [
      'toolbox-talks-new',
      'toolbox-talks-[id]',
      'toolbox-talks-[id]-edit',
    ] as const) {
      expect(toolboxTalksMetadata[key].sidebarHidden, key).toBe(true);
    }
  });

  test('every role reads; admins and managers manage; the module gate is the entitlement', () => {
    for (const role of ['admin', 'manager', 'employee'] as const) {
      expect(getPermissionsForRole(role), role).toContain('toolbox-talks:read');
    }
    expect(getPermissionsForRole('admin')).toContain('toolbox-talks:manage');
    expect(getPermissionsForRole('manager')).toContain('toolbox-talks:manage');
    expect(getPermissionsForRole('employee')).not.toContain(
      'toolbox-talks:manage'
    );
  });

  test('the route segment is guarded by the module id', () => {
    expect(layout).toInclude('<ModuleGuard moduleId="toolbox-talks">');
  });
});
