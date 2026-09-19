/**
 * The module contract, the nav metadata and the route layout describe one
 * module. Pinned so the three cannot drift: the same id, the same
 * permission string on the sidebar entry and the metadata gate, and a
 * `ModuleGuard` on the route segment.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { getPermissionsForRole } from '@/nav/access/roles';
import { toolboxTalksMetadata } from '@/nav/metadata/toolbox-talks.meta';
import { toolboxTalksModule } from './module.config';

const layout = readFileSync(
  new URL('../../app/users/dashboard/toolbox-talks/layout.tsx', import.meta.url),
  'utf8'
);

describe('Toolbox Talks module wiring', () => {
  test('the entitlement key follows the module id', () => {
    expect(toolboxTalksModule.id).toBe('toolbox-talks');
    expect(toolboxTalksModule.entitlementFeatureKey).toBe('MODULE_TOOLBOX_TALKS');
  });

  test('the nav entry and the metadata gate on the same permission', () => {
    const entry = toolboxTalksMetadata['toolbox-talks'];
    expect(entry.moduleId).toBe(toolboxTalksModule.id);
    expect(entry.access?.permissions).toEqual(
      toolboxTalksModule.nav[0].requiredPermissions
    );
    expect(toolboxTalksModule.nav[0].path).toBe('/users/dashboard/toolbox-talks');
  });

  test('every role holds the read permission; the module gate is the entitlement', () => {
    for (const role of ['admin', 'manager', 'employee'] as const) {
      expect(getPermissionsForRole(role), role).toContain('toolbox-talks:read');
    }
  });

  test('the route segment is guarded by the module id', () => {
    expect(layout).toInclude('<ModuleGuard moduleId="toolbox-talks">');
  });
});
