import { describe, expect, test } from 'bun:test';
import type { ReviewBatchResult } from '@tornotron/echno-core/inspection/types';
import {
  EMPTY_SELECTION,
  MISSING_RESULT_MESSAGE,
  applyBatchResults,
  chunkIds,
  moveFocusIndex,
  pageCheckState,
  selectRange,
  selectedOnPage,
  setPageSelection,
  summariseOutcome,
  toggleSelection,
} from './grid-selection';

/**
 * The grid review's selection and result handling (Phase 4 WP5). What is
 * pinned: click toggles and anchors, Shift-click selects the range from the
 * anchor in page order, the header checkbox takes or clears the page, arrows
 * stop at the ends, and a bulk result with mixed statuses keeps exactly the
 * failures selected, each with its message.
 */

const page = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'];

describe('selection', () => {
  test('a click toggles one tile and anchors the range there', () => {
    const once = toggleSelection(EMPTY_SELECTION, 'o2');
    expect([...once.selected]).toEqual(['o2']);
    expect(once.anchor).toBe('o2');
    expect([...toggleSelection(once, 'o2').selected]).toEqual([]);
  });

  test('Shift-click selects from the anchor to the tile, either direction', () => {
    const anchored = toggleSelection(EMPTY_SELECTION, 'o2');
    expect(selectedOnPage(selectRange(anchored, page, 'o5'), page)).toEqual([
      'o2',
      'o3',
      'o4',
      'o5',
    ]);
    const back = toggleSelection(EMPTY_SELECTION, 'o5');
    expect(selectedOnPage(selectRange(back, page, 'o3'), page)).toEqual([
      'o3',
      'o4',
      'o5',
    ]);
  });

  test('Shift-click adds to the selection and keeps the anchor', () => {
    let selection = toggleSelection(EMPTY_SELECTION, 'o6');
    selection = toggleSelection(selection, 'o1');
    selection = selectRange(selection, page, 'o3');
    expect(selectedOnPage(selection, page)).toEqual(['o1', 'o2', 'o3', 'o6']);
    expect(selection.anchor).toBe('o1');
  });

  test('Shift-click with no anchor on the page acts as a click', () => {
    const selection = selectRange(
      { selected: new Set(), anchor: 'elsewhere' },
      page,
      'o4'
    );
    expect([...selection.selected]).toEqual(['o4']);
  });

  test('the header checkbox selects and clears the page and reports its state', () => {
    expect(pageCheckState(EMPTY_SELECTION, page)).toBe(false);
    const some = toggleSelection(EMPTY_SELECTION, 'o1');
    expect(pageCheckState(some, page)).toBe('indeterminate');
    const all = setPageSelection(some, page, true);
    expect(pageCheckState(all, page)).toBe(true);
    expect(pageCheckState(setPageSelection(all, page, false), page)).toBe(
      false
    );
    expect(pageCheckState(EMPTY_SELECTION, [])).toBe(false);
  });
});

describe('arrow keys', () => {
  test('left and right step, up and down move a row, focus stops at the ends', () => {
    expect(moveFocusIndex(0, 'ArrowLeft', 3, 6)).toBe(0);
    expect(moveFocusIndex(0, 'ArrowRight', 3, 6)).toBe(1);
    expect(moveFocusIndex(1, 'ArrowDown', 3, 6)).toBe(4);
    expect(moveFocusIndex(4, 'ArrowDown', 3, 6)).toBe(4);
    expect(moveFocusIndex(4, 'ArrowUp', 3, 6)).toBe(1);
    expect(moveFocusIndex(5, 'ArrowRight', 3, 6)).toBe(5);
    expect(moveFocusIndex(0, 'ArrowDown', 3, 0)).toBe(-1);
  });
});

describe('bulk results', () => {
  const sent = ['o1', 'o2', 'o3', 'o4', 'o5'];
  const result: ReviewBatchResult = {
    batchId: '99999999-9999-4999-8999-999999999999',
    results: [
      { observationId: 'o1', status: 'REVIEWED' },
      { observationId: 'o2', status: 'ALREADY_REVIEWED' },
      { observationId: 'o3', status: 'NOT_FOUND' },
      {
        observationId: 'o4',
        status: 'REFUSED',
        message: 'A rejection needs a reason when the model drew regions.',
      },
    ],
  };
  const selection = setPageSelection(EMPTY_SELECTION, sent, true);

  test('settled rows leave the selection; failures stay with their message', () => {
    const outcome = applyBatchResults(sent, [result], selection);
    expect(selectedOnPage(outcome.selection, page)).toEqual(['o3', 'o4', 'o5']);
    expect(outcome.reviewed).toBe(1);
    expect(outcome.alreadyReviewed).toBe(1);
    expect(outcome.failures.get('o3')).toBe('Not found');
    expect(outcome.failures.get('o4')).toBe(
      'A rejection needs a reason when the model drew regions.'
    );
    expect(outcome.failures.get('o5')).toBe(MISSING_RESULT_MESSAGE);
    expect(outcome.failures.has('o1')).toBe(false);
    expect(summariseOutcome(outcome)).toBe(
      '1 reviewed, 1 already decided, 3 not reviewed'
    );
  });

  test('results split over several requests are read together', () => {
    const [first, second] = [
      { ...result, results: result.results.slice(0, 2) },
      { ...result, results: result.results.slice(2) },
    ];
    const outcome = applyBatchResults(sent, [first, second], selection);
    expect(outcome.reviewed).toBe(1);
    expect(outcome.failures.size).toBe(3);
  });

  test('an all-good batch clears the selection', () => {
    const outcome = applyBatchResults(
      ['o1'],
      [{ ...result, results: [{ observationId: 'o1', status: 'REVIEWED' }] }],
      toggleSelection(EMPTY_SELECTION, 'o1')
    );
    expect(outcome.selection.selected.size).toBe(0);
    expect(summariseOutcome(outcome)).toBe('1 reviewed');
  });

  test('ids are sent in requests of at most 100', () => {
    const ids = Array.from({ length: 230 }, (_, i) => `o${i}`);
    expect(chunkIds(ids).map((chunk) => chunk.length)).toEqual([100, 100, 30]);
  });
});
