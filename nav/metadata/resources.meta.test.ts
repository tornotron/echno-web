import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { resourcesMetadata } from './resources.meta';
import { STORES_ACCESS } from '../access/roles';

/**
 * Pins which Resources entries carry the store-document gate, so a later
 * edit cannot silently drop one and put a 403-on-click link back in the
 * sidebar (echno-web #427).
 */
const GATED_PREFIXES = [
  'resources-materials',
  'resources-goods-receipts',
  'resources-purchase-orders',
  'resources-indents',
  'resources-transfers',
  'resources-material-consumptions',
];

const isGatedId = (id: string) =>
  GATED_PREFIXES.some((p) => id === p || id.startsWith(`${p}-`));

describe('resourcesMetadata store gate', () => {
  test('STORES_ACCESS names exactly the #650 read threshold', () => {
    expect(STORES_ACCESS.allowOrgRoles).toEqual([
      OrgRole.STORE_KEEPER,
      OrgRole.PROJECT_MANAGER,
      OrgRole.SYSTEM_ADMIN,
    ]);
    expect(STORES_ACCESS.allowRoles).toBeUndefined();
  });

  test('every store entry, including hidden children, is gated and hidden when locked', () => {
    const gated = Object.entries(resourcesMetadata).filter(([id]) =>
      isGatedId(id)
    );
    expect(gated.map(([id]) => id).toSorted()).toEqual(
      [
        'resources-goods-receipts',
        'resources-goods-receipts-new',
        'resources-goods-receipts-[id]',
        'resources-indents',
        'resources-indents-new',
        'resources-indents-[id]',
        'resources-material-consumptions',
        'resources-material-consumptions-new',
        'resources-material-consumptions-[id]',
        'resources-materials',
        'resources-materials-all-materials',
        'resources-materials-new',
        'resources-materials-[id]',
        'resources-materials-[id]-edit',
        'resources-purchase-orders',
        'resources-purchase-orders-new',
        'resources-purchase-orders-[id]',
        'resources-transfers',
        'resources-transfers-new',
        'resources-transfers-[id]',
        'resources-transfers-[id]-edit',
      ].toSorted()
    );
    for (const [id, meta] of gated) {
      expect(meta.access, id).toBe(STORES_ACCESS);
      expect(meta.hideWhenLocked, id).toBe(true);
    }
  });

  test('assets, stock adjustments, storage locations and the section root stay open', () => {
    const open = Object.entries(resourcesMetadata).filter(
      ([id]) => !isGatedId(id)
    );
    expect(open.length).toBeGreaterThan(0);
    for (const [id, meta] of open) {
      expect(meta.access, id).toBeUndefined();
    }
  });
});
