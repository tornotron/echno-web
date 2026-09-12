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

import type {
  LeaveBalance,
  LeaveBalanceSummary,
  LeavePolicy,
} from '@tornotron/echno-core/leave/types';

/**
 * A balance together with the annual quota of the policy it is measured
 * against. The backend embeds the policy in every balance it returns, but
 * core's `parseLeaveBalance` keeps only its id and type name, so the quota is
 * joined back on from the policy list here.
 */
export type LeaveBalanceWithQuota = LeaveBalance & { annualQuota: number };

/** A balance summary whose balances carry their annual quota. */
export type LeaveBalanceSummaryWithQuota = Omit<
  LeaveBalanceSummary,
  'balances'
> & { balances: LeaveBalanceWithQuota[] };

/**
 * Joins each balance to its policy by `leavePolicyId` and copies the policy's
 * annual quota onto it. A balance whose policy is not in the list gets `0`,
 * which the figures below treat as "no quota configured".
 *
 * @param balances - Parsed balances.
 * @param policies - The policies those balances are measured against.
 * @returns The same balances, each with an `annualQuota`.
 */
export function attachAnnualQuota(
  balances: LeaveBalance[],
  policies: readonly LeavePolicy[] | undefined
): LeaveBalanceWithQuota[] {
  const quotaByPolicy = new Map(
    (policies ?? []).map((p) => [p.id, p.annualQuota])
  );
  return balances.map((b) => ({
    ...b,
    annualQuota: quotaByPolicy.get(b.leavePolicyId) ?? 0,
  }));
}

/** The fields the derived figures read. */
export type EntitlementFields = Pick<
  LeaveBalanceWithQuota,
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
