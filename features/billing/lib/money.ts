/** Rupee formatting for the billing surfaces. Prices arrive in rupees, checkout amounts in paise. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Empty for anything that is not a finite number, so a missing amount never prints as "NaN". */
export function formatRupees(rupees: number | null | undefined): string {
  if (typeof rupees !== 'number' || !Number.isFinite(rupees)) return '';
  return inr.format(rupees);
}

export function formatPaise(paise: number | null | undefined): string {
  if (typeof paise !== 'number' || !Number.isFinite(paise)) return '';
  return inr.format(paise / 100);
}
