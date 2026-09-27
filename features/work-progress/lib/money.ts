const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/** Rupees as the schedule shows them; empty for anything that is not a finite number. */
export function formatInr(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  return inr.format(amount);
}
