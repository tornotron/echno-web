/** Rupee formatting for the billing surfaces. Prices arrive in rupees, checkout amounts in paise. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatRupees(rupees: number): string {
  return inr.format(rupees);
}

export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}
