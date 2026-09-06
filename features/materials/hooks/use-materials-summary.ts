'use client';

import { useMaterialStockSummary } from '@tornotron/echno-core/materials/hooks';

/** The organization's materials figures, and what they say about a list on hand. */
export interface MaterialsSummary {
  /**
   * How many materials the organization has. `undefined` until the server
   * has answered, and never inferred from a list: a number made up from a
   * page is the defect this replaces.
   */
  materialCount?: number;
  /** How many distinct units of measure those materials are held in. */
  distinctUnits?: number;
  /**
   * The value of the stock on hand across the organization, summed in the
   * database over every balance row rather than over the rows a browser
   * happens to hold.
   */
  totalStockValue?: number;
  /**
   * How many holdings the value could not price, because the stock behind
   * them was received with no unit cost. Non-zero means the total
   * understates and says by how many holdings; it qualifies the figure
   * rather than withholding it.
   */
  unvaluedHoldingCount?: number;
  /**
   * Whether the list passed in is the whole catalogue. False while the
   * count is unknown. The two totals above no longer depend on this, but
   * a breakdown drawn from the list still does: a share of 500 loaded rows
   * is not a share of the catalogue.
   */
  holdsWholeCatalogue: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * The materials figures a dashboard strip shows, read from the server.
 *
 * Every one of them used to be worked out in the browser from the material
 * list already fetched. That list is `GET /materials/web`, which serves at
 * most 500 rows and reports the cut in an `X-Result-Capped` response
 * header; the console's API proxy rebuilds every response and forwards
 * `Content-Type` alone, so the header never reaches the browser. Past the
 * cap the sum was the value of 500 materials and the unit count was the
 * units those 500 were held in, both of them presented as the
 * organization's and both short.
 *
 * `GET /materials/web/summary` totals all of it in the database, so the
 * figures are the organization's whether the list holds 15 rows or 7,430.
 * The catalogue size arrives on the same payload, which is one request
 * where the count alone used to take a second one.
 *
 * @param loadedCount - How many materials the caller is holding.
 */
export function useMaterialsSummary(loadedCount: number): MaterialsSummary {
  const query = useMaterialStockSummary();
  const summary = query.data;
  const materialCount = summary?.materialCount;

  return {
    materialCount,
    distinctUnits: summary?.distinctUnits,
    totalStockValue: summary?.totalStockValue,
    unvaluedHoldingCount: summary?.unvaluedHoldingCount,
    holdsWholeCatalogue:
      materialCount !== undefined && loadedCount >= materialCount,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
