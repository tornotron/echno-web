import { describe, expect, test } from 'bun:test';
import { ProjectBillingState } from '@tornotron/echno-core/contract-billing/types';
import {
  PROJECT_STATE_CLASSES,
  PROJECT_STATE_LABELS,
  PROJECT_STATE_STROKES,
  projectLocation,
  projectStateCounts,
  ringSegments,
} from './projects';

const { NO_CONTRACTS, IN_PROGRESS, PAYMENT_DUE, SETTLED } = ProjectBillingState;

describe('project billing helpers', () => {
  test('every state has a label, a chip and a ring colour', () => {
    for (const state of Object.values(ProjectBillingState)) {
      expect(PROJECT_STATE_LABELS[state]).toBeTruthy();
      expect(PROJECT_STATE_CLASSES[state]).toBeTruthy();
      expect(PROJECT_STATE_STROKES[state]).toBeTruthy();
    }
  });

  test('the counts lead with what needs attention and leave out empty states', () => {
    const rows = [
      { billingState: SETTLED },
      { billingState: PAYMENT_DUE },
      { billingState: PAYMENT_DUE },
      { billingState: NO_CONTRACTS },
    ];
    expect(projectStateCounts(rows)).toEqual([
      { state: PAYMENT_DUE, count: 2 },
      { state: SETTLED, count: 1 },
      { state: NO_CONTRACTS, count: 1 },
    ]);
    expect(projectStateCounts([])).toEqual([]);
  });

  test('the ring segments cover the circle in order', () => {
    const segments = ringSegments([
      { state: PAYMENT_DUE, count: 1 },
      { state: IN_PROGRESS, count: 3 },
    ]);
    expect(segments.map((s) => [s.share, s.offset])).toEqual([
      [0.25, 0],
      [0.75, 0.25],
    ]);
    expect(ringSegments([])).toEqual([]);
  });

  test('a location uses what the project has', () => {
    expect(projectLocation({ city: 'Kochi', state: 'Kerala' })).toBe(
      'Kochi, Kerala'
    );
    expect(projectLocation({ state: 'Kerala' })).toBe('Kerala');
    expect(projectLocation({})).toBe('');
  });
});
