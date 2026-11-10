/**
 * The module contract, the nav metadata and the route layout describe one
 * module. Pinned so the three cannot drift: the same id, the same permission
 * on the sidebar entry and the metadata gate, the Projects section the
 * backend's nav descriptor names, and a `ModuleGuard` on the route segment.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { getPermissionsForRole } from '@/nav/access/roles';
import { documentIngestionMetadata } from '@/nav/metadata/document-ingestion.meta';
import { documentIngestionModule } from './module.config';

const layout = readFileSync(
  new URL(
    '../../app/users/dashboard/document-ingestion/layout.tsx',
    import.meta.url
  ),
  'utf8'
);

describe('Document Ingestion module wiring', () => {
  test('the entitlement key follows the module id', () => {
    expect(documentIngestionModule.id).toBe('document-ingestion');
    expect(documentIngestionModule.entitlementFeatureKey).toBe(
      'MODULE_DOCUMENT_INGESTION'
    );
  });

  test('the nav entry and the metadata gate on the same permission, in the projects section', () => {
    const entry = documentIngestionMetadata['document-ingestion'];
    expect(entry.moduleId).toBe(documentIngestionModule.id);
    expect(entry.section).toBe('projects');
    expect(documentIngestionModule.nav[0].section).toBe('projects');
    expect(entry.access?.permissions).toEqual(
      documentIngestionModule.nav[0].requiredPermissions
    );
    expect(documentIngestionModule.nav[0].path).toBe(
      '/users/dashboard/document-ingestion'
    );
    expect(
      documentIngestionMetadata['document-ingestion-[id]'].sidebarHidden
    ).toBe(true);
  });

  test('every role reads; the backend decides who may apply', () => {
    for (const role of ['admin', 'manager', 'employee'] as const) {
      expect(getPermissionsForRole(role), role).toContain(
        'document-ingestion:read'
      );
    }
  });

  test('the route segment is guarded by the module id', () => {
    expect(layout).toInclude('<ModuleGuard moduleId="document-ingestion">');
  });
});
