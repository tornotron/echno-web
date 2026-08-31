'use client';

import { useMemo } from 'react';
import { useLowStockMaterials } from '@tornotron/echno-core/materials/hooks';
import type { LowStockMaterial } from '@tornotron/echno-core/materials/types';

/**
 * Rows to ask the low-stock endpoint for.
 *
 * 500 is the backend's own ceiling on a page (`UnpagedResultCap.MAX_ROWS`),
 * so this is as much of the list as one request can carry. The count does
 * not depend on it: `totalElements` is the whole set whatever page size was
 * asked for, and {@link useOrganizationLowStock} reports that number rather
 * than the length of what came back.
 */
const LOW_STOCK_PAGE_SIZE = 500;

/**
 * The organization-wide low-stock answer, read from the server.
 *
 * Every consumer on the materials dashboard calls this, so the card that
 * shows the count and the table that badges the rows share one request and
 * one answer. A count and a badge that disagree on the same screen are
 * worse than either being wrong alone.
 *
 * Nothing here derives low stock in the browser. `GET /materials/web` is
 * capped at 500 rows, carries the organization-wide aggregate only, and
 * has never seen a per-location threshold override, so a comparison made
 * over it answers for the page it happens to hold and reads as the whole
 * catalogue.
 */
export function useOrganizationLowStock() {
  const query = useLowStockMaterials({ pageSize: LOW_STOCK_PAGE_SIZE });

  const rows: LowStockMaterial[] = useMemo(
    () => query.data?.content ?? [],
    [query.data]
  );

  const materialIds = useMemo(
    () => new Set(rows.map((r) => r.materialId)),
    [rows]
  );

  return {
    /** The low-stock rows this page could carry, most depleted first. */
    rows,
    /** Material ids on those rows, for badging a row already loaded. */
    materialIds,
    /**
     * How many materials are low across the organization. `undefined`
     * until the server has answered, and never inferred from `rows`: a
     * number made up from a partial page is the defect this replaces.
     */
    total: query.data?.totalElements,
    /**
     * Whether the count is larger than the rows on hand, which happens
     * only past the page ceiling. A screen listing the rows should say so.
     */
    hasMoreThanLoaded: (query.data?.totalElements ?? 0) > rows.length,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
