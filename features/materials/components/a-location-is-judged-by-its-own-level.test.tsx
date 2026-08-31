/**
 * Which reorder level the stock-by-location rows are judged against.
 *
 * The tab already resolved the per-location `MaterialLocationThreshold`
 * override, and used it for one thing only: filling the threshold-edit
 * dialog. The row colouring and the status badge went on comparing against
 * the material's global level. So the one screen that breaks stock down by
 * location was the one screen where a location's own level was ignored, and
 * a storekeeper could open the editor, read "Reorder Level 100" for that
 * site, and see the row beside it badged "In Stock" at 40 because the
 * material's global level is 30.
 *
 * Both directions matter and both are tested: an override that is higher
 * makes a row low that the global level called healthy, and one that is
 * lower makes a row healthy that the global level called low.
 *
 * Assertions stay on counts and strings, never on a rendered node: an
 * assertion that fails while printing a Radix element hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realInventoryHooks from '@tornotron/echno-core/inventory-transactions/hooks';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';
import type { MaterialStock } from '@tornotron/echno-core/inventory-transactions/types';
import type { MaterialLocationThreshold } from '@tornotron/echno-core/materials/types';

const SITE_A = 11;
const SITE_B = 22;

let thresholds: MaterialLocationThreshold[] = [];

const materialStock: MaterialStock = {
  materialId: 3,
  materialName: 'TNT Steel',
  totalStock: 80,
  totalStockValue: 8000,
  locationStock: [
    {
      storageLocationId: SITE_A,
      storageLocationName: 'Site A Godown',
      projectId: 1,
      projectName: 'Riverside Phase 2',
      stock: 40,
      stockValue: 4000,
    },
    {
      storageLocationId: SITE_B,
      storageLocationName: 'Site B Godown',
      projectId: 2,
      projectName: 'Hilltop Villas',
      stock: 40,
      stockValue: 4000,
    },
  ],
};

function noopMutation() {
  return { mutate: mock((..._args: unknown[]) => {}), isPending: false };
}

mock.module('@tornotron/echno-core/inventory-transactions/hooks', () => ({
  ...realInventoryHooks,
  useMaterialStock: () => ({ data: materialStock, isLoading: false }),
  useInventoryTransactionsByStorageLocationAndMaterial: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useMaterialLocationThresholds: () => ({ data: thresholds }),
  useUpsertMaterialLocationThreshold: () => noopMutation(),
  useDeleteMaterialLocationThreshold: () => noopMutation(),
}));

const { MaterialStockByLocationTab } = await import(
  './material-stock-by-location-tab'
);

function override(
  storageLocationId: number,
  reorderLevel: number
): MaterialLocationThreshold {
  return {
    id: storageLocationId,
    materialId: 3,
    storageLocationId,
    storageLocationName: `Location ${storageLocationId}`,
    reorderLevel,
  };
}

/** The status cell of every rendered location row, in order. */
function badges(globalReorderLevel: number | undefined = 30): string[] {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { container } = render(
    createElement(MaterialStockByLocationTab, {
      materialId: 3,
      unit: 'kg',
      globalThresholds: { reorderLevel: globalReorderLevel },
    }),
    { wrapper }
  );
  return [...container.querySelectorAll('tbody tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('td')];
    // Project, Storage Location, Stock, Stock Value, Status, ...
    return (cells[5]?.textContent ?? '').trim();
  });
}

afterEach(() => {
  cleanup();
  thresholds = [];
});

describe('the status badge on a stock-by-location row', () => {
  test('uses a location override that is stricter than the global level', () => {
    // 40 units against a global level of 30 is healthy. Site A set its own
    // level to 100, which is the whole reason it set one.
    thresholds = [override(SITE_A, 100)];

    expect(badges(30)).toEqual(['Low', 'In Stock']);
  });

  test('uses a location override that is looser than the global level', () => {
    // The mirror case: a site that deliberately runs thin is not low.
    thresholds = [override(SITE_B, 5)];

    expect(badges(50)).toEqual(['Low', 'In Stock']);
  });

  test('falls back to the material level where a location sets none', () => {
    thresholds = [];

    expect(badges(50)).toEqual(['Low', 'Low']);
    expect(badges(30)).toEqual(['In Stock', 'In Stock']);
  });

  test('treats an override of zero as set, not as absent', () => {
    // Zero is a level somebody chose. Reading it as "no override" would put
    // the global level back and badge a stocked location low.
    thresholds = [override(SITE_A, 0)];

    expect(badges(50)).toEqual(['In Stock', 'Low']);
  });

  test('reports a location holding nothing as empty whatever the level', () => {
    thresholds = [override(SITE_A, 100)];
    const emptyRow = { ...materialStock.locationStock[0], stock: 0 };
    const restore = materialStock.locationStock[0];
    materialStock.locationStock[0] = emptyRow;

    try {
      expect(badges(30)[0]).toBe('Empty');
    } finally {
      materialStock.locationStock[0] = restore;
    }
  });
});
