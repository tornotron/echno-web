/**
 * What the "Low Stock Alert" card counts.
 *
 * It used to filter the material array the page had already fetched. That
 * array comes from `GET /materials/web`, which serves at most 500 rows and
 * marks the cut only in a header nothing reads, so past the cap the card
 * counted the first page of the catalogue and presented it as the whole of
 * it. It failed short, which is the direction nobody checks: a storekeeper
 * reading "3 materials low" has no way to see that the real number is
 * larger.
 *
 * The card now reports `totalElements` from `GET /materials/web/low-stock`,
 * which is the count across the organization however few rows came back
 * with it. Every test below fails on the old card: it rendered no count at
 * all, and it took its rows from a `materials` prop that no longer exists.
 *
 * Assertions stay on strings and counts, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';
import type { PagedLowStockMaterials } from '@tornotron/echno-core/materials/services';

let page: PagedLowStockMaterials | undefined;
let isLoading = false;
let isError = false;

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useLowStockMaterials: () => ({ data: page, isLoading, isError }),
}));

const { LowStockAlert } = await import('./materials-insights-row');

function row(over: Record<string, unknown> = {}) {
  return {
    materialId: 1,
    sku: 'TNT-STEEL-001',
    materialName: 'TNT Steel',
    unit: 'kg',
    currentStock: 1,
    reorderLevel: 30,
    shortfall: 29,
    ...over,
  } as PagedLowStockMaterials['content'][number];
}

function card() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { container } = render(createElement(LowStockAlert), { wrapper });
  return (container.textContent ?? '').replaceAll(/\s+/g, ' ');
}

afterEach(() => {
  cleanup();
  page = undefined;
  isLoading = false;
  isError = false;
});

describe('the count on the Low Stock Alert card', () => {
  test('is the server total, not the number of rows it was sent', () => {
    // The defect in one assertion. Five rows arrived; forty-seven materials
    // are low. A card that counts what it holds says five.
    page = {
      content: Array.from({ length: 5 }, (_, i) =>
        row({ materialId: i + 1, materialName: `Material ${i + 1}` })
      ),
      totalElements: 47,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const text = card();

    expect(text).toContain('47');
    expect(text).toContain('47materials at or below their reorder level');
    expect(text).toContain('Showing the 5 most depleted of 47');
  });

  test('says all is well only when the server says the total is zero', () => {
    page = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 500,
    };

    const text = card();

    expect(text).toContain('All materials are well stocked');
    expect(text).toContain('Nothing has reached its reorder level');
  });

  test('does not claim all is well while the answer is still loading', () => {
    isLoading = true;

    const text = card();

    expect(text).not.toContain('All materials are well stocked');
    expect(text).toContain('Checking stock levels');
  });

  test('shows no number at all when the server could not be asked', () => {
    // The failure mode worth naming: an alert that cannot be computed must
    // say so. Falling back to a count over the loaded page would put a
    // confident, short number under a heading that reads as an alert.
    isError = true;

    const text = card();

    expect(text).not.toContain('All materials are well stocked');
    expect(text).toContain('The count is unknown');
    expect(text).not.toMatch(/\d/);
  });

  test('reads the level the server compared against, not a global one', () => {
    page = {
      content: [
        row({
          materialName: 'TNT Steel',
          currentStock: 1,
          reorderLevel: 5,
          unit: 'nos',
        }),
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const text = card();

    expect(text).toContain('TNT Steel');
    expect(text).toContain('1 / 5 nos');
    expect(text).toContain('1material at or below their reorder level');
  });

  test('does not promise a "of N" tail when every low material is listed', () => {
    page = {
      content: [row({ materialId: 1 }), row({ materialId: 2 })],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 500,
    };

    const text = card();

    expect(text).toContain('2materials at or below');
    expect(text).not.toContain('most depleted of');
  });
});
