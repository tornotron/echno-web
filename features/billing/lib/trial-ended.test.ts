/**
 * When the trial-ended notice applies (ClickUp 14zdkkvzx5e): the organization
 * came off a trial with no payment provider behind it and is on the Free plan,
 * or on nothing yet in the minutes before the backend writes the move.
 */
import { describe, expect, test } from 'bun:test';
import { parseSubscription } from '@tornotron/echno-core/billing/types';
import { endedTrialNotice, trialNoticeStorageKey } from './trial-ended';

const NOW = new Date('2026-12-02T10:30:00Z');

const trial = (overrides: Record<string, unknown> = {}) =>
  parseSubscription({
    id: 7,
    organizationId: 31,
    status: 'EXPIRED',
    provider: 'NONE',
    plan: { id: 3, code: 'PRO', name: 'Professional Plan' },
    trialStart: '2026-11-02T10:00:00Z',
    trialEnd: '2026-12-02T10:00:00Z',
    ...overrides,
  });

const free = parseSubscription({
  id: 8,
  organizationId: 31,
  status: 'ACTIVE',
  provider: 'NONE',
  plan: { id: 1, code: 'FREE', name: 'Free Plan' },
  currentPeriodStart: '2026-12-02T10:00:00Z',
});

describe('endedTrialNotice', () => {
  test('applies on the Free plan straight after a manual trial', () => {
    expect(endedTrialNotice(free, [free, trial()], NOW)).toEqual({
      organizationId: 31,
      trialEnd: '2026-12-02T10:00:00Z',
      planName: 'Professional Plan',
    });
  });

  test('applies before the backend has written the move, while the trial row still says TRIALING', () => {
    expect(
      endedTrialNotice(null, [trial({ status: 'TRIALING' })], NOW)?.planName
    ).toBe('Professional Plan');
  });

  test('does not apply while the trial is still running', () => {
    const running = trial({ status: 'TRIALING' });
    expect(
      endedTrialNotice(running, [running], new Date('2026-12-02T09:59:59Z'))
    ).toBeNull();
    expect(
      endedTrialNotice(null, [running], new Date('2026-12-02T09:59:59Z'))
    ).toBeNull();
  });

  test('does not apply once a paid plan is bought', () => {
    const paid = parseSubscription({
      id: 9,
      status: 'ACTIVE',
      provider: 'RAZORPAY',
      plan: { id: 3, code: 'PRO', name: 'Professional Plan' },
    });
    expect(endedTrialNotice(paid, [paid, free, trial()], NOW)).toBeNull();
  });

  test('does not apply to a trial the payment provider ran', () => {
    expect(
      endedTrialNotice(free, [free, trial({ provider: 'RAZORPAY' })], NOW)
    ).toBeNull();
  });

  test('does not apply to an organization that chose the Free plan without a trial', () => {
    expect(endedTrialNotice(free, [free], NOW)).toBeNull();
  });

  test('remembers a dismissal per organization and per trial', () => {
    const ended = endedTrialNotice(free, [free, trial()], NOW)!;
    expect(trialNoticeStorageKey(ended)).toBe(
      'echno.trial-ended-notice.31.2026-12-02T10:00:00Z'
    );
  });
});
