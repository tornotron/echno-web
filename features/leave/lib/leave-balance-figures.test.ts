import { describe, expect, it } from 'bun:test';
import {
  leaveEntitlement,
  leaveUsedPercent,
  type EntitlementFields,
} from './leave-balance-figures';

/**
 * A balance in the shape the screens see it. `openingBalance` is deliberately set
 * to the same value as `carryForwardFromPrevious`, because that is what the
 * backend does, and it is what made the old `openingBalance + carryForward` sum
 * count the same days twice.
 */
function balance(fields: Partial<EntitlementFields> = {}): EntitlementFields {
  return {
    annualQuota: 12,
    carryForwardFromPrevious: 0,
    used: 0,
    ...fields,
  };
}

describe('leaveEntitlement', () => {
  it('is the policy quota when nothing was carried forward', () => {
    expect(leaveEntitlement(balance({ annualQuota: 12 }))).toBe(12);
  });

  it('adds carried-forward days to the quota exactly once', () => {
    expect(
      leaveEntitlement(
        balance({ annualQuota: 12, carryForwardFromPrevious: 3 })
      )
    ).toBe(15);
  });

  it('is zero, not a false figure, when no quota is configured', () => {
    expect(leaveEntitlement(balance({ annualQuota: 0 }))).toBe(0);
  });

  it('keeps a half day carried forward', () => {
    expect(
      leaveEntitlement(
        balance({ annualQuota: 10, carryForwardFromPrevious: 0.5 })
      )
    ).toBe(10.5);
  });
});

describe('leaveUsedPercent', () => {
  it('measures used against the whole entitlement', () => {
    expect(leaveUsedPercent(balance({ annualQuota: 12, used: 3 }))).toBe(25);
  });

  it('counts carried-forward days in the denominator', () => {
    expect(
      leaveUsedPercent(
        balance({ annualQuota: 12, carryForwardFromPrevious: 8, used: 5 })
      )
    ).toBe(25);
  });

  it('is zero when there is no entitlement to be a share of', () => {
    // The case that used to divide by zero and paint every card as 0% of 0.
    expect(leaveUsedPercent(balance({ annualQuota: 0, used: 0 }))).toBe(0);
  });

  it('does not run past 100 when more was used than granted', () => {
    expect(leaveUsedPercent(balance({ annualQuota: 10, used: 14 }))).toBe(100);
  });

  it('handles a half day used', () => {
    expect(leaveUsedPercent(balance({ annualQuota: 10, used: 0.5 }))).toBe(5);
  });
});
