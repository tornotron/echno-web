/**
 * What the materials KPI strip counts, and where the figures come from.
 *
 * Every figure on it used to come off the `materials` prop: `length` for
 * Total Materials, a `reduce` over `stockValue` for Total Stock Value, the
 * size of a `Set` of units for Unique Units. That array is `GET
 * /materials/web`, which serves at most 500 rows and reports the cut in an
 * `X-Result-Capped` header the API proxy does not forward. So past 500
 * materials the strip answered for one page and read as the catalogue.
 *
 * The first fix withheld the two it could not verify. The backend now
 * totals all three in the database, so they are shown again, and they are
 * the organization's whether the list holds 15 rows or 7,430. What still
 * depends on the loaded rows is the composition donut, which is a
 * breakdown rather than a total and keeps saying what it was drawn from.
 *
 * Every test fails on the previous strip: it read a page envelope for the
 * count, and it withheld the value and the unit count whenever the rows on
 * hand were not the whole catalogue.
 *
 * Assertions stay on strings and counts, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';
import type { MaterialStockSummary } from '@tornotron/echno-core/materials/types';
import type { Material } from '@tornotron/echno-core/materials/types';

let summary: MaterialStockSummary | undefined;
let isLoading = false;
let isError = false;
let pageReads = 0;

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useMaterialStockSummary: () => ({ data: summary, isLoading, isError }),
  useMaterialsPage: () => {
    pageReads += 1;
    return { data: undefined, isLoading: false, isError: false };
  },
}));

const { MaterialsKpiStrip } = await import('./materials-kpi-strip');

function material(over: Partial<Material> = {}): Material {
  return {
    id: 1,
    materialName: 'OPC 53 Cement',
    unit: 'bag',
    stockValue: 100_000,
    ...over,
  } as Material;
}

/** `n` materials, each worth `value`, all in the same unit. */
function rows(n: number, value: number, unit = 'bag'): Material[] {
  return Array.from({ length: n }, (_, i) =>
    material({
      id: i + 1,
      materialName: `Material ${i + 1}`,
      unit,
      stockValue: value,
    })
  );
}

/** A summary as the server totals it, for the whole organization. */
function totals(over: Partial<MaterialStockSummary> = {}): MaterialStockSummary {
  return {
    materialCount: 743,
    distinctUnits: 9,
    totalStockValue: 50_148_300,
    unvaluedHoldingCount: 0,
    ...over,
  };
}

function strip(materials: Material[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { container } = render(
    createElement(MaterialsKpiStrip, { materials, consumptions: [] }),
    { wrapper }
  );
  return (container.textContent ?? '').replaceAll(/\s+/g, ' ');
}

afterEach(() => {
  cleanup();
  summary = undefined;
  isLoading = false;
  isError = false;
  pageReads = 0;
});

describe('Total Materials', () => {
  test('is the server total, not the number of rows the page holds', () => {
    // The defect in one assertion. Five rows loaded; 743 materials in the
    // catalogue. A strip that counts what it holds says five.
    summary = totals();

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials743');
    expect(text).not.toContain('Total Materials5across');
  });

  test('comes off the summary, without a second request for the count', () => {
    // The count used to take its own pageSize=1 read of the paginated
    // listing. It is on this payload now, so that read is gone.
    summary = totals();

    strip(rows(5, 1000));

    expect(pageReads).toBe(0);
  });

  test('shows no number when the server could not be asked', () => {
    isError = true;

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials—totals unavailable');
  });

  test('does not print a stale count while the answer is still loading', () => {
    isLoading = true;

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials—totalling the catalogue');
  });
});

describe('Total Stock Value', () => {
  test('is shown over a catalogue larger than the rows on hand', () => {
    // The figure the previous strip withheld. 500 rows loaded out of 743,
    // and the total is the server's for all 743.
    summary = totals();

    const text = strip(rows(500, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).toContain('current inventory value');
    expect(text).not.toContain('not shown');
  });

  test('is the server total, not the sum of the rows on hand', () => {
    // Three rows worth a lakh each. A strip summing what it holds prints
    // ₹3.0L; the organization holds ₹5.01 crore of stock.
    summary = totals();

    const text = strip(rows(3, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).not.toContain('₹3.0L');
  });

  test('shows a genuine zero rather than withholding it', () => {
    // Nothing held is an answer the server gives, not an absent figure.
    summary = totals({ totalStockValue: 0, materialCount: 4 });

    const text = strip(rows(4, 0));

    expect(text).toContain('Total Stock Value₹0');
  });

  test('shows no number when the summary could not be fetched', () => {
    // Falling back to the browser sum here would put back the figure the
    // server was asked to replace.
    isError = true;

    const text = strip(rows(15, 100_000));

    expect(text).not.toContain('₹15.0L');
    expect(text).toContain('Total Stock Value—totals unavailable');
  });

  test('says what the total leaves out when holdings carry no price', () => {
    summary = totals({ unvaluedHoldingCount: 4 });

    const text = strip(rows(500, 100_000));

    expect(text).toContain('₹5.0Cr');
    expect(text).toContain('excludes 4 unpriced holdings');
    expect(text).not.toContain('current inventory value');
  });

  test('counts one unpriced holding in the singular', () => {
    summary = totals({ unvaluedHoldingCount: 1 });

    const text = strip(rows(500, 100_000));

    expect(text).toContain('excludes 1 unpriced holding');
    expect(text).not.toContain('holdings');
  });

  test('adds no caveat when every holding in scope is priced', () => {
    summary = totals({ unvaluedHoldingCount: 0 });

    const text = strip(rows(500, 100_000));

    expect(text).toContain('current inventory value');
    expect(text).not.toContain('unpriced');
  });
});

describe('Unique Units', () => {
  test('is the server count, over a catalogue larger than the rows on hand', () => {
    // 500 rows all held in bags. The catalogue is held in nine units, and
    // the previous strip withheld the number rather than say one.
    summary = totals();

    const text = strip(rows(500, 1000, 'bag'));

    expect(text).toContain('Unique Units9material unit types');
  });

  test('is the server count, not the units the loaded rows happen to use', () => {
    summary = totals({ materialCount: 2, distinctUnits: 9 });

    const text = strip([
      material({ id: 1, unit: 'bag' }),
      material({ id: 2, unit: 'kg' }),
    ]);

    expect(text).toContain('Unique Units9');
    expect(text).not.toContain('Unique Units2');
  });

  test('shows no number when the summary could not be fetched', () => {
    isError = true;

    const text = strip(rows(5, 1000, 'bag'));

    expect(text).toContain('Unique Units—totals unavailable');
  });
});

describe('Composition by Unit', () => {
  test('says what it was drawn from when that is not the whole catalogue', () => {
    // A breakdown, not a total, and this endpoint gives it none. It stays
    // captioned even though the tiles beside it no longer need to be.
    summary = totals();

    const text = strip(rows(500, 1000, 'bag'));

    expect(text).toContain('of the 500 loaded');
  });

  test('adds no such caveat when the rows are all of them', () => {
    summary = totals({ materialCount: 3 });

    const text = strip(rows(3, 1000, 'bag'));

    expect(text).not.toContain('loaded');
  });
});
