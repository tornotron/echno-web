import { describe, expect, it } from 'bun:test';
import { parseLeaveBalance, parseLeaveBalanceSummary } from './leave-balance';

/**
 * The shape the backend sends: the leave policy is embedded in the balance, and the
 * annual quota lives on that policy rather than at the top level. The parser used to
 * drop it, which left every screen with no entitlement to show and put "Quota 0"
 * beside a ten-day balance.
 */
function backendBalance(overrides: Record<string, unknown> = {}) {
  return {
    id: 88,
    employeeId: 18,
    leavePolicy: {
      id: 3,
      leaveTypeCode: 'SL',
      leaveTypeName: 'Sick Leave',
      annualQuota: 15,
      allowHalfDay: true,
      isPaid: true,
    },
    year: 2026,
    openingBalance: 0,
    accrued: 10,
    used: 0,
    pending: 0,
    carryForwardFromPrevious: 0,
    available: 10,
    bookable: 10,
    ...overrides,
  };
}

describe('parseLeaveBalance', () => {
  it('reads the annual quota off the embedded policy', () => {
    expect(parseLeaveBalance(backendBalance()).annualQuota).toBe(15);
  });

  it('prefers a top-level quota when one is sent', () => {
    const parsed = parseLeaveBalance(backendBalance({ annualQuota: 20 }));

    expect(parsed.annualQuota).toBe(20);
  });

  it('falls back to zero rather than undefined when no policy is embedded', () => {
    const parsed = parseLeaveBalance(
      backendBalance({ leavePolicy: undefined, leavePolicyId: 3 })
    );

    expect(parsed.annualQuota).toBe(0);
  });

  it('keeps the quota separate from the opening balance', () => {
    // openingBalance is what last year carried over, and is zero in a first year.
    // Reading it as the quota is what produced "Quota 0" beside 10 days available.
    const parsed = parseLeaveBalance(backendBalance());

    expect(parsed.openingBalance).toBe(0);
    expect(parsed.annualQuota).toBe(15);
    expect(parsed.availableBalance).toBe(10);
  });

  it('carries a half day through used and pending', () => {
    const parsed = parseLeaveBalance(
      backendBalance({ used: 3.5, pending: 0.5, available: 6.5, bookable: 6 })
    );

    expect(parsed.used).toBe(3.5);
    expect(parsed.pending).toBe(0.5);
    expect(parsed.availableBalance).toBe(6.5);
    expect(parsed.bookableBalance).toBe(6);
  });
});

describe('parseLeaveBalanceSummary', () => {
  it('carries the quota through each balance it contains', () => {
    const parsed = parseLeaveBalanceSummary({
      employeeId: 18,
      year: 2026,
      balances: [
        backendBalance(),
        backendBalance({
          id: 89,
          leavePolicy: {
            id: 4,
            leaveTypeName: 'Casual Leave',
            annualQuota: 12,
          },
        }),
      ],
      totalAvailable: 20,
      totalUsed: 0,
      totalPending: 0,
    });

    expect(parsed.balances.map((b) => b.annualQuota)).toEqual([15, 12]);
  });
});
