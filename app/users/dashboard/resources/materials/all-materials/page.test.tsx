/**
 * What the All Materials tiles count, and whose catalogue they answer for.
 *
 * All four figures used to be arithmetic over the `useMaterials()` array:
 * `length` for Total Materials, a `reduce` over `stockValue` for Stock
 * Value, the size of a `Set` of units for Unique Units, a `filter` for
 * With SKU. That array is `GET /materials/web`, which serves at most 500
 * rows and reports the cut in an `X-Result-Capped` header the API proxy
 * does not forward. Nothing on the page was gated on the cap, so past 500
 * materials a screen titled "All Materials" reported 500 as the catalogue
 * size and summed the value of 500 holdings under "total inventory value".
 * Every figure was wrong only once the catalogue was large enough for
 * anyone to care, and none of them said so.
 *
 * Three are now the server's, totalled in the database by
 * `GET /materials/web/summary`. The fourth has no server aggregate, so it
 * stays a count of the rows on hand and says that is what it counted.
 *
 * The scope is the organization. This route carries no project segment and
 * the screen has no project picker; the list it shows is the unscoped
 * `useMaterials()`. Passing a `projectId` here would put one project's
 * totals on a page titled All Materials, which reads as plausible and is
 * the reason the scope is pinned below rather than assumed.
 *
 * Assertions stay on strings and counts, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import type {
  Material,
  MaterialStockSummary,
} from '@tornotron/echno-core/materials/types';

let materials: Material[] = [];
let summary: MaterialStockSummary | undefined;
let isLoading = false;
let isError = false;

/** Every scope the page asked the summary endpoint for, newest last. */
const summaryScopes: Array<Record<string, unknown> | undefined> = [];

import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useMaterials: () => ({ data: materials, isLoading: false, isError: false }),
  useMaterialStockSummary: (params?: Record<string, unknown>) => {
    summaryScopes.push(params);
    return { data: summary, isLoading, isError };
  },
}));

// The list below the tiles is the whole search, filter and pagination
// surface and takes no part in what is under test.
mock.module('@/features/materials/components', () => ({
  MaterialList: () => null,
}));

mock.module('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

const pageModule = await import('./page');
const AllMaterialsPage = pageModule.default;

function material(over: Partial<Material> = {}): Material {
  return {
    id: 1,
    materialName: 'OPC 53 Cement',
    unit: 'bag',
    sku: 'CEM-53',
    stockValue: 100_000,
    ...over,
  } as Material;
}

/** `n` materials, each worth `value`, all in the same unit and all with a SKU. */
function rows(n: number, value: number, unit = 'bag'): Material[] {
  return Array.from({ length: n }, (_, i) =>
    material({
      id: i + 1,
      materialName: `Material ${i + 1}`,
      unit,
      sku: `SKU-${i + 1}`,
      stockValue: value,
    })
  );
}

/** A summary as the server totals it, for the whole organization. */
function totals(
  over: Partial<MaterialStockSummary> = {}
): MaterialStockSummary {
  return {
    materialCount: 743,
    distinctUnits: 9,
    totalStockValue: 50_148_300,
    unvaluedHoldingCount: 0,
    ...over,
  };
}

/** Renders the page over `loaded` rows and returns its text, whitespace collapsed. */
function page(loaded: Material[]): string {
  materials = loaded;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { container } = render(createElement(AllMaterialsPage), { wrapper });
  return (container.textContent ?? '').replaceAll(/\s+/g, ' ');
}

afterEach(() => {
  cleanup();
  materials = [];
  summary = undefined;
  isLoading = false;
  isError = false;
  summaryScopes.length = 0;
});

describe('scope', () => {
  test('asks for the organization, not for a project', () => {
    // A projectId here would show one project's stock as the catalogue's,
    // on a page whose title promises the opposite.
    summary = totals();

    page(rows(5, 1000));

    expect(summaryScopes.length).toBe(1);
    expect(summaryScopes[0]?.projectId).toBeUndefined();
    expect(Object.keys(summaryScopes[0] ?? {})).not.toContain('projectId');
  });
});

describe('Total Materials', () => {
  test('is the server total, not the number of rows the page holds', () => {
    // The defect in one assertion. Five rows loaded; 743 materials in the
    // catalogue. A page that counts what it holds says five.
    summary = totals();

    const text = page(rows(5, 1000));

    expect(text).toContain('Total Materials743');
    expect(text).not.toContain('Total Materials5');
  });

  test('shows no number when the server could not be asked', () => {
    isError = true;

    const text = page(rows(5, 1000));

    expect(text).toContain('Total Materials—totals unavailable');
  });

  test('does not print a stale count while the answer is still loading', () => {
    isLoading = true;

    const text = page(rows(5, 1000));

    expect(text).toContain('Total Materials—totalling the catalogue');
  });
});

describe('Stock Value', () => {
  test('is the server total, not the sum of the rows on hand', () => {
    // Three rows worth a lakh each. A page summing what it holds prints
    // ₹3.0L; the organization holds ₹5.01 crore of stock.
    summary = totals();

    const text = page(rows(3, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).not.toContain('₹3.0L');
  });

  test('prints a crore as a crore rather than as hundreds of lakh', () => {
    // The page had its own `(v / 100_000).toFixed(1)` with an L pinned to
    // it, so ₹5.01 crore read as "₹501.5L".
    summary = totals();

    const text = page(rows(500, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).not.toContain('₹501.5L');
  });

  test('shows a genuine zero rather than a zero with a unit on it', () => {
    // Nothing held is an answer the server gives. "₹0.0L" is that answer
    // dressed as a rounding.
    summary = totals({ totalStockValue: 0, materialCount: 4 });

    const text = page(rows(4, 0));

    expect(text).toContain('Stock Value₹0current inventory value');
  });

  test('shows no number when the summary could not be fetched', () => {
    // Falling back to the browser sum here would put back the figure the
    // server was asked to replace.
    isError = true;

    const text = page(rows(15, 100_000));

    expect(text).not.toContain('₹15.0L');
    expect(text).toContain('Stock Value—totals unavailable');
  });

  test('says what the total leaves out when holdings carry no price', () => {
    summary = totals({ unvaluedHoldingCount: 4 });

    const text = page(rows(500, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).toContain('excludes 4 unpriced holdings');
    expect(text).not.toContain('inventory value');
  });

  test('counts one unpriced holding in the singular', () => {
    summary = totals({ unvaluedHoldingCount: 1 });

    const text = page(rows(500, 100_000));

    expect(text).toContain('excludes 1 unpriced holding');
    expect(text).not.toContain('holdings');
  });

  test('adds no caveat when every holding in scope is priced', () => {
    summary = totals({ unvaluedHoldingCount: 0 });

    const text = page(rows(500, 100_000));

    expect(text).toContain('current inventory value');
    expect(text).not.toContain('unpriced');
  });
});

describe('Unique Units', () => {
  test('is the server count, over a catalogue larger than the rows on hand', () => {
    // 500 rows all held in bags. The catalogue is held in nine units.
    summary = totals();

    const text = page(rows(500, 1000, 'bag'));

    expect(text).toContain('Unique Units9unit types in use');
  });

  test('is the server count, not the units the loaded rows happen to use', () => {
    summary = totals({ materialCount: 2, distinctUnits: 9 });

    const text = page([
      material({ id: 1, unit: 'bag' }),
      material({ id: 2, unit: 'kg' }),
    ]);

    expect(text).toContain('Unique Units9');
    expect(text).not.toContain('Unique Units2');
  });

  test('shows no number when the summary could not be fetched', () => {
    isError = true;

    const text = page(rows(5, 1000, 'bag'));

    expect(text).toContain('Unique Units—totals unavailable');
  });
});

describe('With SKU', () => {
  test('says it counted the loaded rows when those are not the catalogue', () => {
    // The one figure with no server aggregate. It stays a count of what
    // the browser holds, so it has to say so where the others no longer
    // need to.
    summary = totals();

    const text = page(rows(500, 1000));

    expect(text).toContain('With SKU500of the 500 loaded');
  });

  test('adds no such caveat when the rows are all of them', () => {
    // Regression guard: passes before the change as well as after.
    summary = totals({ materialCount: 3 });

    const text = page(rows(3, 1000));

    expect(text).toContain('With SKU3have SKU assigned');
  });
});
