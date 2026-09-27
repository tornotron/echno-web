import { describe, expect, test } from 'bun:test';
import { WbsStatus, type WbsActivity } from '@tornotron/echno-core/wbs/types';
import { ProgressOutcome } from '@tornotron/echno-core/work-progress/types';
import {
  canTakeProgress,
  delayLabel,
  isLateAt,
  summarize,
  todayAtSites,
} from './schedule';

const activity = (over: Partial<WbsActivity>): WbsActivity => ({
  id: 1,
  wbsCode: '1',
  title: 'Footings',
  level: 0,
  sortOrder: 0,
  status: WbsStatus.NOT_STARTED,
  progress: 0,
  weight: 1,
  budgetedCost: 0,
  actualCost: 0,
  isLeaf: true,
  isMilestone: false,
  ...over,
});

describe('the client delay rule', () => {
  const planned = '2026-09-10';

  test('an open activity is late once the inspection passes the planned finish', () => {
    expect(isLateAt(planned, ProgressOutcome.PARTIAL, '2026-09-10')).toBe(
      false
    );
    expect(isLateAt(planned, ProgressOutcome.PARTIAL, '2026-09-11')).toBe(true);
    expect(
      isLateAt(
        planned,
        ProgressOutcome.NOT_DONE,
        '2026-09-05',
        undefined,
        '2026-09-12'
      )
    ).toBe(true);
  });

  test('a finished activity is late only by its actual finish', () => {
    expect(
      isLateAt(planned, ProgressOutcome.DONE, '2026-09-20', '2026-09-09')
    ).toBe(false);
    expect(
      isLateAt(planned, ProgressOutcome.DONE, '2026-09-20', '2026-09-12')
    ).toBe(true);
  });

  test('with no planned finish nothing is late', () => {
    expect(isLateAt(undefined, ProgressOutcome.NOT_DONE, '2026-12-31')).toBe(
      false
    );
  });
});

describe('schedule helpers', () => {
  test('the delay label reads on time or days late', () => {
    expect(delayLabel(undefined)).toBeUndefined();
    expect(delayLabel(0)).toBe('On time');
    expect(delayLabel(1)).toBe('1 day late');
    expect(delayLabel(15)).toBe('15 days late');
  });

  test('only an open leaf takes a progress inspection', () => {
    expect(canTakeProgress(activity({}))).toBe(true);
    expect(canTakeProgress(activity({ isLeaf: false }))).toBe(false);
    expect(canTakeProgress(activity({ status: WbsStatus.COMPLETED }))).toBe(
      false
    );
    expect(canTakeProgress(activity({ status: WbsStatus.CANCELLED }))).toBe(
      false
    );
  });

  test('the summary counts leaves only', () => {
    const summary = summarize([
      activity({ id: 1, isLeaf: false, delayDays: 4 }),
      activity({ id: 2, status: WbsStatus.COMPLETED, delayDays: 0 }),
      activity({ id: 3, delayDays: 4, isMilestone: true }),
    ]);
    expect(summary).toEqual({
      activities: 2,
      completed: 1,
      delayed: 1,
      milestones: 1,
    });
  });

  test('today is the IST date even when UTC is still on the day before', () => {
    expect(todayAtSites(new Date('2026-09-18T20:00:00Z'))).toBe('2026-09-19');
  });
});
