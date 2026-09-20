import { describe, expect, test } from 'bun:test';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import { resourcesMetadata } from './resources.meta';
import {
  ASSET_WRITE_ACCESS,
  STORAGE_LOCATION_WRITE_ACCESS,
  STORES_ACCESS,
} from '../access/roles';

/**
 * Pins which Resources entries carry the store-document gate, so a later
 * edit cannot silently drop one and put a 403-on-click link back in the
 * sidebar (echno-web #427). Stock adjustments and storage locations joined
 * the set on echno-backend #853, when their reads moved to the stores tier.
 */
const GATED_PREFIXES = [
  'resources-materials',
  'resources-goods-receipts',
  'resources-purchase-orders',
  'resources-indents',
  'resources-transfers',
  'resources-material-consumptions',
  'resources-stock-adjustments',
];

/**
 * Storage locations are read by the stores tier and written by the
 * administrator alone, so the list and detail carry STORES_ACCESS while the
 * form routes carry the narrower write gate.
 */
const STORAGE_LOCATION_ENTRIES = {
  'resources-storage-locations': STORES_ACCESS,
  'resources-storage-locations-new': STORAGE_LOCATION_WRITE_ACCESS,
  'resources-storage-locations-[id]': STORES_ACCESS,
  'resources-storage-locations-[id]-edit': STORAGE_LOCATION_WRITE_ACCESS,
} as const;

/** Assets: any member reads the register, the project pair writes it. */
const ASSET_ENTRIES = {
  'resources-assets': undefined,
  'resources-assets-new': ASSET_WRITE_ACCESS,
  'resources-assets-[id]': undefined,
  'resources-assets-[id]-edit': ASSET_WRITE_ACCESS,
} as const;

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
        'resources-stock-adjustments',
        'resources-stock-adjustments-new',
        'resources-stock-adjustments-[id]',
        'resources-stock-adjustments-[id]-edit',
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

  test('storage locations: the stores tier reads, the administrator writes', () => {
    for (const [id, access] of Object.entries(STORAGE_LOCATION_ENTRIES)) {
      const meta = resourcesMetadata[id as keyof typeof resourcesMetadata];
      expect(meta.access, id).toBe(access);
      expect(meta.hideWhenLocked, id).toBe(true);
    }
  });

  test("assets: the register is open, the forms are the project pair's", () => {
    for (const [id, access] of Object.entries(ASSET_ENTRIES)) {
      const meta = resourcesMetadata[id as keyof typeof resourcesMetadata];
      expect(meta.access, id).toBe(access);
      if (access) expect(meta.hideWhenLocked, id).toBe(true);
    }
  });

  test('the section root, the asset register and reversals stay open', () => {
    const pinned = new Set([
      ...Object.keys(STORAGE_LOCATION_ENTRIES),
      ...Object.keys(ASSET_ENTRIES),
    ]);
    const open = Object.entries(resourcesMetadata).filter(
      ([id]) => !isGatedId(id) && !pinned.has(id)
    );
    expect(open.map(([id]) => id).toSorted()).toEqual([
      'resources',
      'resources-reversals',
      'resources-reversals-[id]',
    ]);
    for (const [id, meta] of open) {
      expect(meta.access, id).toBeUndefined();
    }
  });
});
