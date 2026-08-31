/**
 * Where the materials table gets "Low Stock" from.
 *
 * The badge and the `LOW_STOCK` filter were both arithmetic on the row:
 * `currentStock <= reorderLevel` over whatever the page had fetched. That
 * put a second answer to the same question on the same screen as the Low
 * Stock Alert card, free to disagree with it, and it could only ever
 * describe the rows already loaded.
 *
 * Both now read the server's answer, so the count in the card and the
 * badges in the table are one number. Where the loaded list cannot show
 * every low material, the table says so rather than presenting what it has
 * as the whole answer.
 *
 * Assertions stay on counts and strings: printing a Radix element into a
 * failure message hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';
import type { Material } from '@tornotron/echno-core/materials/types';
import type { PagedLowStockMaterials } from '@tornotron/echno-core/materials/services';

let page: PagedLowStockMaterials | undefined;

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useLowStockMaterials: () => ({
    data: page,
    isLoading: false,
    isError: false,
  }),
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({ push: mock((..._args: unknown[]) => {}) }),
}));

const { MaterialsDashboardTable } = await import('./materials-dashboard-table');

function material(over: Partial<Material> & { id: number }): Material {
  return {
    materialName: `Material ${over.id}`,
    unit: 'kg',
    ...over,
  } as Material;
}

function lowRow(materialId: number) {
  return {
    materialId,
    materialName: `Material ${materialId}`,
    unit: 'kg',
    currentStock: 1,
    reorderLevel: 30,
    shortfall: 29,
  } as PagedLowStockMaterials['content'][number];
}

function table(materials: Material[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return render(createElement(MaterialsDashboardTable, { materials }), {
    wrapper,
  });
}

type Screen = ReturnType<typeof table>;

/** Text of the status cell on every rendered row, in order. */
function statuses({ container }: Screen): string[] {
  return [...container.querySelectorAll('tbody tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('td')];
    // Material, Category, Stock, Stock Value, Trend, Status, Actions
    return (cells[5]?.textContent ?? '').trim();
  });
}

/**
 * Picks "Low Stock" out of the status filter. The header carries two
 * comboboxes, category then status, so the second is the one wanted.
 */
async function filterToLowStock(view: Screen) {
  const triggers = [...view.container.querySelectorAll('[role="combobox"]')];
  expect(triggers.length).toBeGreaterThanOrEqual(2);
  const trigger = triggers[1] as HTMLElement;
  fireEvent.pointerDown(trigger, { button: 0 });
  fireEvent.click(trigger);
  fireEvent.click(await view.findByRole('option', { name: 'Low Stock' }));
}

/** Everything the screen renders, whitespace flattened. */
function text(view: Screen): string {
  return (view.container.textContent ?? '').replaceAll(/\s+/g, ' ');
}

afterEach(() => {
  cleanup();
  page = undefined;
});

describe('the Low Stock badge in the materials table', () => {
  test('follows the server, not the arithmetic on the row', () => {
    // Row 2 reads healthy on the aggregate the list carries. The server,
    // which can see where that stock actually sits, says it is low.
    page = {
      content: [lowRow(2)],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const view = table([
      material({ id: 1, currentStock: 5, reorderLevel: 30 }),
      material({ id: 2, currentStock: 60, reorderLevel: 30 }),
    ]);

    expect(statuses(view)).toEqual(['In Stock', 'Low Stock']);
  });

  test('still calls a location holding nothing out of stock', () => {
    page = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 500,
    };

    const view = table([
      material({ id: 1, currentStock: 0, reorderLevel: 30 }),
    ]);

    expect(statuses(view)).toEqual(['Out of Stock']);
  });

  test('says how many low materials the loaded list cannot show', async () => {
    // Forty are low; two of them are on the page this browser fetched. The
    // table must not present two as the answer.
    page = {
      content: [lowRow(1), lowRow(2)],
      totalElements: 40,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const view = table([
      material({ id: 1, currentStock: 1, reorderLevel: 30 }),
      material({ id: 2, currentStock: 1, reorderLevel: 30 }),
    ]);

    await filterToLowStock(view);

    expect(text(view)).toContain(
      '40 materials are at or below their reorder level'
    );
    expect(text(view)).toContain('2 of them are on this list');
  });

  test('says nothing extra when the loaded list holds every low material', async () => {
    page = {
      content: [lowRow(1)],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const view = table([
      material({ id: 1, currentStock: 1, reorderLevel: 30 }),
    ]);

    await filterToLowStock(view);

    expect(text(view)).not.toContain('are on this list');
  });
});
