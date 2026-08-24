/**
 * Formats a rupee amount for the budgeting views: the ₹ symbol, Indian
 * digit grouping, and exactly two decimal places so money columns line up.
 */
export function formatBudgetAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
