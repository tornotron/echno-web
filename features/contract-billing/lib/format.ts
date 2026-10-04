const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantity = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const percent = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Rupees with Indian digit grouping (₹42,50,000.00); a dash for a missing amount. */
export function formatInr(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '-';
  return inr.format(amount);
}

/** A quantity to at most three places, Indian grouping; a dash when missing. */
export function formatQty(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return quantity.format(value);
}

/** A percent to at most two places; a dash when missing. */
export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${percent.format(value)}%`;
}

/** An ISO date (or date-time) as 30 Sep 2026; a dash when missing. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** An ISO date-time as 30 Sep 2026, 02:30 pm; a dash when missing. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Reads a number typed into a quantity or amount field. Empty is `null`;
 * anything that is not a non-negative finite number is `undefined`, which
 * the caller reports as invalid.
 */
export function parseAmountInput(raw: string): number | null | undefined {
  const text = raw.trim();
  if (text === '') return null;
  const value = Number(text.replaceAll(',', ''));
  if (!Number.isFinite(value) || value < 0) return undefined;
  return value;
}
