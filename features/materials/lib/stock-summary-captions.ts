/**
 * @module stock-summary-captions
 *
 * How a materials tile prints the server's totals, and what it says when a
 * total has not arrived.
 *
 * Two screens show the same figures: the dashboard KPI strip and the All
 * Materials page. They read the same endpoint through
 * `useMaterialsSummary`, so the wording and the rounding live here rather
 * than being written twice. The All Materials page had its own
 * `(v / 100_000).toFixed(1)` before this, which printed a crore of stock
 * as "₹501.5L".
 */

/**
 * A rupee figure in the Indian scale the site staff read in: crore above a
 * crore, lakh above a lakh, thousand above a thousand, and the plain
 * grouped number below that.
 *
 * @param v - The value in rupees.
 * @returns The figure with its unit, ready to render.
 */
export function formatStockValue(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

/**
 * The sentence a tile shows in place of a figure the server has not given.
 *
 * Falling back to a sum over the rows the browser holds would put back
 * exactly the number the endpoint was added to replace, so a missing total
 * is said to be missing.
 *
 * @param isLoading - Whether the summary request is still in flight.
 * @returns The caption for a tile with no figure.
 */
export function unavailableCaption(isLoading: boolean): string {
  return isLoading ? 'totalling the catalogue' : 'totals unavailable';
}

/** What a stock-value tile needs to caption itself. */
export interface StockValueCaptionInput {
  /** The server's total, or `undefined` while it is unknown. */
  totalStockValue?: number;
  /** How many holdings in scope carried no unit cost. */
  unvaluedHoldingCount?: number;
  /** Whether the summary request is still in flight. */
  isLoading: boolean;
}

/**
 * What the stock value leaves out, when it leaves anything out.
 *
 * Stock received with no unit cost adds quantity at no value, so those
 * holdings sit in the total at the zero they hold and the total
 * understates. Naming them qualifies the figure instead of withholding it.
 *
 * @param input - The total, the unpriced count, and the loading flag.
 * @returns The caption to render under the value.
 */
export function stockValueCaption({
  totalStockValue,
  unvaluedHoldingCount,
  isLoading,
}: StockValueCaptionInput): string {
  if (totalStockValue === undefined) return unavailableCaption(isLoading);
  if (unvaluedHoldingCount === undefined || unvaluedHoldingCount === 0) {
    return 'current inventory value';
  }
  return unvaluedHoldingCount === 1
    ? 'excludes 1 unpriced holding'
    : `excludes ${unvaluedHoldingCount} unpriced holdings`;
}
