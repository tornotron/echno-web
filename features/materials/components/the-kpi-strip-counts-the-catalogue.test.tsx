/**
 * What the materials KPI strip counts, and what it declines to.
 *
 * Every figure on it came off the `materials` prop: `materials.length` for
 * Total Materials, a `reduce` over `stockValue` for Total Stock Value, the
 * size of a `Set` of units for Unique Units. That array is `GET
 * /materials/web`, which serves at most 500 rows and reports the cut in an
 * `X-Result-Capped` header the API proxy does not forward. So past 500
 * materials the strip answered for one page and read as the catalogue,
 * with no error and nothing on screen to say so.
 *
 * The count is now the server's, from the page envelope on `GET
 * /materials/web/all`. The sum and the set cannot be: there is no
 * server-side aggregate to ask (echno-backend#673), and 501 rows cannot be
 * totalled by a browser holding 500. So they are shown when the loaded
 * rows are the whole catalogue and withheld when they are not. A missing
 * number is honest; a confident wrong one is the bug.
 *
 * Every test fails on the old strip: it had no server count to read, and
 * it printed the sum and the unit count unconditionally.
 *
 * Assertions stay on strings and counts, never on a rendered node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import * as realMaterialsHooks from '@tornotron/echno-core/materials/hooks';
import type { PagedMaterials } from '@tornotron/echno-core/materials/services';
import type { Material } from '@tornotron/echno-core/materials/types';

let page: PagedMaterials | undefined;
let isLoading = false;
let isError = false;

mock.module('@tornotron/echno-core/materials/hooks', () => ({
  ...realMaterialsHooks,
  useMaterialsPage: () => ({ data: page, isLoading, isError }),
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

/** A count-only page envelope: no rows, the total on the envelope. */
function envelope(totalElements: number): PagedMaterials {
  return {
    content: [],
    totalElements,
    totalPages: totalElements,
    number: 0,
    size: 1,
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
  page = undefined;
  isLoading = false;
  isError = false;
});

describe('Total Materials', () => {
  test('is the server total, not the number of rows the page holds', () => {
    // The defect in one assertion. Five rows loaded; forty-seven materials
    // in the catalogue. A strip that counts what it holds says five.
    page = envelope(47);

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials47');
    expect(text).not.toContain('Total Materials5across');
  });

  test('shows no number when the server could not be asked', () => {
    isError = true;

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials—count unavailable');
  });

  test('does not print a stale count while the answer is still loading', () => {
    isLoading = true;

    const text = strip(rows(5, 1000));

    expect(text).toContain('Total Materials—counting the catalogue');
  });
});

describe('Total Stock Value', () => {
  test('is shown when the loaded rows are the whole catalogue', () => {
    page = envelope(3);

    const text = strip(rows(3, 100_000));

    expect(text).toContain('₹3.0L');
    expect(text).toContain('current inventory value');
  });

  test('is withheld when the catalogue is larger than the rows on hand', () => {
    // 500 rows of one lakh each is half a crore, and the catalogue holds
    // 743 materials. The old strip rendered ₹5.0Cr and captioned it
    // "current inventory value".
    page = envelope(743);

    const text = strip(rows(500, 100_000));

    expect(text).not.toContain('Cr');
    expect(text).toContain('not shown: 500 of 743 materials loaded');
  });

  test('is withheld when the catalogue size is unknown, not assumed complete', () => {
    // Fifteen rows almost certainly are the catalogue. Almost is not a
    // basis for printing a money figure.
    isError = true;

    const text = strip(rows(15, 100_000));

    expect(text).not.toContain('₹15.0L');
    expect(text).toContain('not shown: the catalogue size is unknown');
  });
});

describe('Unique Units', () => {
  test('counts the units when the rows are the whole catalogue', () => {
    page = envelope(2);

    const text = strip([
      material({ id: 1, unit: 'bag' }),
      material({ id: 2, unit: 'kg' }),
    ]);

    expect(text).toContain('Unique Units2material unit types');
  });

  test('is withheld over a partial catalogue, where it can only undercount', () => {
    page = envelope(743);

    const text = strip(rows(500, 1000, 'bag'));

    expect(text).not.toContain('Unique Units1');
    expect(text).toContain('Unique Units—');
  });
});

describe('Composition by Unit', () => {
  test('says what it was drawn from when that is not the whole catalogue', () => {
    page = envelope(743);

    const text = strip(rows(500, 1000, 'bag'));

    expect(text).toContain('of the 500 loaded');
  });

  test('adds no such caveat when the rows are all of them', () => {
    page = envelope(3);

    const text = strip(rows(3, 1000, 'bag'));

    expect(text).not.toContain('loaded');
  });
});
