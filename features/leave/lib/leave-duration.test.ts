import { describe, expect, test } from 'bun:test';
import { HalfDayType } from '@tornotron/echno-core/leave/types';
import {
  checkDurationAgainstPolicy,
  describeDuration,
  formatLeaveDays,
  halfDayTypeLabel,
  isHalfDay,
  isSingleDayRange,
  reconcileHalfDaySelection,
  type DurationPolicy,
} from './leave-duration';

const policy = (over: Partial<DurationPolicy> = {}): DurationPolicy => ({
  leaveTypeName: 'Casual Leave',
  allowHalfDay: true,
  minDaysPerRequest: 0.5,
  maxDaysPerRequest: undefined,
  ...over,
});

describe('halfDayTypeLabel and isHalfDay', () => {
  test('names each value', () => {
    expect(halfDayTypeLabel(HalfDayType.FIRST_HALF)).toBe('First Half');
    expect(halfDayTypeLabel(HalfDayType.SECOND_HALF)).toBe('Second Half');
    expect(halfDayTypeLabel(HalfDayType.FULL_DAY)).toBe('Full Day');
  });

  test('an absent value reads as a full day', () => {
    expect(halfDayTypeLabel()).toBe('Full Day');
    expect(halfDayTypeLabel(null)).toBe('Full Day');
  });

  test('only the two halves count as a half day', () => {
    expect(isHalfDay(HalfDayType.FIRST_HALF)).toBe(true);
    expect(isHalfDay(HalfDayType.SECOND_HALF)).toBe(true);
    expect(isHalfDay(HalfDayType.FULL_DAY)).toBe(false);
    expect(isHalfDay(null)).toBe(false);
  });
});

describe('isSingleDayRange', () => {
  test('same date is a single day', () => {
    expect(isSingleDayRange('2026-08-27', '2026-08-27')).toBe(true);
  });

  test('different dates are not', () => {
    expect(isSingleDayRange('2026-08-27', '2026-08-29')).toBe(false);
  });

  test('an empty range is not a single day', () => {
    expect(isSingleDayRange('', '')).toBe(false);
  });
});

describe('reconcileHalfDaySelection', () => {
  test('a policy that forbids half days clears the selection', () => {
    expect(
      reconcileHalfDaySelection(
        {
          startHalfDayType: HalfDayType.FIRST_HALF,
          endHalfDayType: HalfDayType.FIRST_HALF,
        },
        '2026-08-27',
        '2026-08-27',
        false
      )
    ).toEqual({ startHalfDayType: null, endHalfDayType: null });
  });

  test('a single day carries one value on both ends', () => {
    expect(
      reconcileHalfDaySelection(
        { startHalfDayType: HalfDayType.SECOND_HALF, endHalfDayType: null },
        '2026-08-27',
        '2026-08-27',
        true
      )
    ).toEqual({
      startHalfDayType: HalfDayType.SECOND_HALF,
      endHalfDayType: HalfDayType.SECOND_HALF,
    });
  });

  // The backend subtracts half a day for a SECOND_HALF start and a FIRST_HALF
  // end. The mirror values change nothing, so carrying them would show a
  // selection the total ignores.
  test('a range keeps only the values the total actually reads', () => {
    expect(
      reconcileHalfDaySelection(
        {
          startHalfDayType: HalfDayType.SECOND_HALF,
          endHalfDayType: HalfDayType.FIRST_HALF,
        },
        '2026-08-27',
        '2026-08-29',
        true
      )
    ).toEqual({
      startHalfDayType: HalfDayType.SECOND_HALF,
      endHalfDayType: HalfDayType.FIRST_HALF,
    });
  });

  test('a range drops the values the backend would ignore', () => {
    expect(
      reconcileHalfDaySelection(
        {
          startHalfDayType: HalfDayType.FIRST_HALF,
          endHalfDayType: HalfDayType.SECOND_HALF,
        },
        '2026-08-27',
        '2026-08-29',
        true
      )
    ).toEqual({ startHalfDayType: null, endHalfDayType: null });
  });

  // Picking a half day, then extending the range, previously left the half on
  // both ends where only one of them counted.
  test('collapsing a single-day half into a range keeps only the valid end', () => {
    expect(
      reconcileHalfDaySelection(
        {
          startHalfDayType: HalfDayType.FIRST_HALF,
          endHalfDayType: HalfDayType.FIRST_HALF,
        },
        '2026-08-27',
        '2026-08-29',
        true
      )
    ).toEqual({
      startHalfDayType: null,
      endHalfDayType: HalfDayType.FIRST_HALF,
    });
  });
});

describe('describeDuration', () => {
  test('a single full day', () => {
    expect(
      describeDuration(
        { startHalfDayType: null, endHalfDayType: null },
        true
      )
    ).toBe('Full Day');
  });

  test('a single first half', () => {
    expect(
      describeDuration(
        {
          startHalfDayType: HalfDayType.FIRST_HALF,
          endHalfDayType: HalfDayType.FIRST_HALF,
        },
        true
      )
    ).toBe('Half Day - First Half');
  });

  test('a range starting at midday', () => {
    expect(
      describeDuration(
        { startHalfDayType: HalfDayType.SECOND_HALF, endHalfDayType: null },
        false
      )
    ).toBe('Full days, starting at midday');
  });

  test('a range ending at midday', () => {
    expect(
      describeDuration(
        { startHalfDayType: null, endHalfDayType: HalfDayType.FIRST_HALF },
        false
      )
    ).toBe('Full days, ending at midday');
  });

  test('a range clipped at both ends', () => {
    expect(
      describeDuration(
        {
          startHalfDayType: HalfDayType.SECOND_HALF,
          endHalfDayType: HalfDayType.FIRST_HALF,
        },
        false
      )
    ).toBe('Full days, starting and ending at midday');
  });
});

describe('formatLeaveDays', () => {
  test('keeps the half visible', () => {
    expect(formatLeaveDays(0.5)).toBe('0.5 days');
    expect(formatLeaveDays(2.5)).toBe('2.5 days');
  });

  test('a single day is singular', () => {
    expect(formatLeaveDays(1)).toBe('1 day');
  });

  test('whole days keep no decimal', () => {
    expect(formatLeaveDays(3)).toBe('3 days');
  });
});

describe('checkDurationAgainstPolicy', () => {
  const fullDay = { startHalfDayType: null, endHalfDayType: null };
  const firstHalf = {
    startHalfDayType: HalfDayType.FIRST_HALF,
    endHalfDayType: HalfDayType.FIRST_HALF,
  };

  test('no policy or no duration is not a verdict', () => {
    expect(checkDurationAgainstPolicy(1, fullDay)).toBeNull();
    expect(checkDurationAgainstPolicy(0, fullDay, policy())).toBeNull();
  });

  test('a permitted half day passes', () => {
    expect(checkDurationAgainstPolicy(0.5, firstHalf, policy())).toBeNull();
  });

  test('a half day under a policy that forbids it is refused', () => {
    expect(
      checkDurationAgainstPolicy(
        0.5,
        firstHalf,
        policy({ allowHalfDay: false })
      )
    ).toBe('Casual Leave does not allow half-day leave. Choose full days.');
  });

  test('below the policy minimum is refused', () => {
    expect(
      checkDurationAgainstPolicy(
        0.5,
        firstHalf,
        policy({ minDaysPerRequest: 1 })
      )
    ).toBe('Casual Leave requires at least 1 day per request.');
  });

  test('above the policy maximum is refused', () => {
    expect(
      checkDurationAgainstPolicy(
        7,
        fullDay,
        policy({ maxDaysPerRequest: 5 })
      )
    ).toBe('Casual Leave allows at most 5 days per request.');
  });

  test('exactly on the limits is allowed', () => {
    const bounded = policy({ minDaysPerRequest: 1, maxDaysPerRequest: 5 });
    expect(checkDurationAgainstPolicy(1, fullDay, bounded)).toBeNull();
    expect(checkDurationAgainstPolicy(5, fullDay, bounded)).toBeNull();
  });
});
