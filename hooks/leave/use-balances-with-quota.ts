/**
 * hooks/leave/use-balances-with-quota.ts
 *
 * Balance queries that carry each balance's annual quota. Core's balance
 * parser drops the policy the backend embeds, so these compose the core
 * balance hooks with the employee's policy list and join the quota back on.
 * The join is what the balance card, the balances tab and the CSV export read.
 */

import { useMemo } from 'react';
import {
  useEmployeeBalances,
  useEmployeeBalanceSummary,
  useLeavePoliciesByEmployee,
} from '@tornotron/echno-core/leave/hooks';
import {
  attachAnnualQuota,
  type LeaveBalanceSummaryWithQuota,
  type LeaveBalanceWithQuota,
} from '@/features/leave/lib/leave-balance-figures';

/**
 * The employee's balances for a year, each with its policy's annual quota.
 *
 * @param employeeId - Surrogate id of the employee; `0` disables both queries.
 * @param year - Balance year; defaults server-side to the current year.
 */
export function useEmployeeBalancesWithQuota(
  employeeId: number,
  year?: number
): { data: LeaveBalanceWithQuota[] | undefined; isLoading: boolean } {
  const balances = useEmployeeBalances(employeeId, year);
  const policies = useLeavePoliciesByEmployee(employeeId);

  const data = useMemo(
    () =>
      balances.data
        ? attachAnnualQuota(balances.data, policies.data)
        : undefined,
    [balances.data, policies.data]
  );

  return { data, isLoading: balances.isLoading || policies.isLoading };
}

/**
 * The employee's balance summary for a year, with each balance carrying its
 * policy's annual quota.
 *
 * @param employeeId - Surrogate id of the employee; `0` disables both queries.
 * @param year - Balance year; defaults server-side to the current year.
 */
export function useEmployeeBalanceSummaryWithQuota(
  employeeId: number,
  year?: number
): { data: LeaveBalanceSummaryWithQuota | undefined; isLoading: boolean } {
  const summary = useEmployeeBalanceSummary(employeeId, year);
  const policies = useLeavePoliciesByEmployee(employeeId);

  const data = useMemo(
    () =>
      summary.data
        ? {
            ...summary.data,
            balances: attachAnnualQuota(summary.data.balances, policies.data),
          }
        : undefined,
    [summary.data, policies.data]
  );

  return { data, isLoading: summary.isLoading || policies.isLoading };
}
