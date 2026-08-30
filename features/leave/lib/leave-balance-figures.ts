/**
 * The figures every leave-balance screen reads from one place.
 *
 * A balance carries several day counts that are easy to mistake for one another,
 * and each screen used to combine them its own way. The ones that matter:
 *
 *   - `annualQuota`      what the policy grants for a full year
 *   - `carryForwardFromPrevious`  days brought in from last year
 *   - `openingBalance`   the balance at the start of the year, which the backend
 *                        sets to the carried-forward days. It is NOT the quota,
 *                        and adding it to `carryForwardFromPrevious` counts the
 *                        same days twice
 *   - `accrued`          how much of the quota has been earned so far this year
 *   - `used` / `pending` days taken, and days on requests awaiting a decision
 *   - `availableBalance` opening + accrued - used
 *   - `bookableBalance`  available, less the pending days already spoken for
 *
 * The two derived figures below are what the screens actually need, and keeping
 * them here is what makes My Leaves, Apply for Leave and the admin balance
 * screens agree.
 */

import type { LeaveBalance } from '@/types/leave';

/** The fields the derived figures read. */
export type EntitlementFields = Pick<
  LeaveBalance,
  'annualQuota' | 'carryForwardFromPrevious' | 'used'
>;

/**
 * Days the year grants in total: the policy's annual quota plus anything carried
 * in from last year.
 *
 * This is the denominator a balance is measured against. It is deliberately not
 * `openingBalance + carryForwardFromPrevious`, which is the same days twice.
 *
 * @param balance - The balance to read.
 * @returns The total entitlement in days, `0` when no quota is configured.
 */
export function leaveEntitlement(balance: EntitlementFields): number {
  return (balance.annualQuota ?? 0) + (balance.carryForwardFromPrevious ?? 0);
}

/**
 * Share of the year's entitlement already taken, as a percentage.
 *
 * @param balance - The balance to read.
 * @returns `0` when there is no entitlement to be a share of, else 0-100.
 */
export function leaveUsedPercent(balance: EntitlementFields): number {
  const entitlement = leaveEntitlement(balance);
  if (entitlement <= 0) return 0;
  return Math.min(100, (balance.used / entitlement) * 100);
}
