import {
  REVIEW_BATCH_MAX_IDS,
  isReviewBatchItemSettled,
  reviewBatchItemStatusLabels,
} from '@tornotron/echno-core/inspection/types';
import type { ReviewBatchResult } from '@tornotron/echno-core/inspection/types';

/**
 * Selection and result handling for the grid review. Pure, so the range
 * rules and the mixed-status handling have unit tests without rendering.
 */
export interface GridSelection {
  selected: ReadonlySet<string>;
  /** The last tile clicked without Shift: one end of a Shift-click range. */
  anchor?: string;
}

export const EMPTY_SELECTION: GridSelection = { selected: new Set() };

/** A plain click: flips one tile and makes it the range anchor. */
export function toggleSelection(
  selection: GridSelection,
  id: string
): GridSelection {
  const selected = new Set(selection.selected);
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  return { selected, anchor: id };
}

/**
 * A Shift-click: selects every tile from the anchor to `id` inclusive, in
 * page order, adding to what is already selected. With no anchor on the
 * page it behaves as a plain click. The anchor stays where it was, so a
 * second Shift-click extends from the same tile.
 */
export function selectRange(
  selection: GridSelection,
  pageIds: readonly string[],
  id: string
): GridSelection {
  const from = selection.anchor ? pageIds.indexOf(selection.anchor) : -1;
  const to = pageIds.indexOf(id);
  if (from === -1 || to === -1) return toggleSelection(selection, id);
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const selected = new Set(selection.selected);
  for (const pageId of pageIds.slice(lo, hi + 1)) selected.add(pageId);
  return { selected, anchor: selection.anchor };
}

/** The header checkbox: selects or clears the whole page. */
export function setPageSelection(
  selection: GridSelection,
  pageIds: readonly string[],
  checked: boolean
): GridSelection {
  const selected = new Set(selection.selected);
  for (const id of pageIds) {
    if (checked) selected.add(id);
    else selected.delete(id);
  }
  return { selected, anchor: selection.anchor };
}

/** The header checkbox's state for the page. */
export function pageCheckState(
  selection: GridSelection,
  pageIds: readonly string[]
): boolean | 'indeterminate' {
  if (pageIds.length === 0) return false;
  const count = pageIds.filter((id) => selection.selected.has(id)).length;
  if (count === 0) return false;
  return count === pageIds.length ? true : 'indeterminate';
}

/** Keeps only selected ids still on the page, in page order. */
export function selectedOnPage(
  selection: GridSelection,
  pageIds: readonly string[]
): string[] {
  return pageIds.filter((id) => selection.selected.has(id));
}

/**
 * The tile focus after an arrow key in a grid of `columns` columns and
 * `count` tiles. Left and right step one tile, up and down one row; focus
 * stops at the ends rather than wrapping.
 */
export function moveFocusIndex(
  index: number,
  key: string,
  columns: number,
  count: number
): number {
  if (count === 0) return -1;
  const cols = Math.max(1, columns);
  const current = Math.min(Math.max(index, 0), count - 1);
  switch (key) {
    case 'ArrowRight': {
      return Math.min(count - 1, current + 1);
    }
    case 'ArrowLeft': {
      return Math.max(0, current - 1);
    }
    case 'ArrowDown': {
      return current + cols < count ? current + cols : current;
    }
    case 'ArrowUp': {
      return current - cols >= 0 ? current - cols : current;
    }
    default: {
      return current;
    }
  }
}

/** Splits ids into requests the backend accepts (1 to 100 ids each). */
export function chunkIds(ids: readonly string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += REVIEW_BATCH_MAX_IDS) {
    chunks.push(ids.slice(i, i + REVIEW_BATCH_MAX_IDS));
  }
  return chunks;
}

export interface BulkOutcome {
  /** What stays selected: the ids that did not settle. */
  selection: GridSelection;
  /** Why each one did not, keyed by observation id. */
  failures: Map<string, string>;
  /** How many were reviewed now. */
  reviewed: number;
  /** How many someone else had already decided. */
  alreadyReviewed: number;
}

/** The message shown when an id posted got no entry back at all. */
export const MISSING_RESULT_MESSAGE = 'No result came back for this one.';

/**
 * Folds a bulk review's per-id results into the grid's state. `REVIEWED`
 * and `ALREADY_REVIEWED` leave the selection (the row is decided either
 * way, and the list refresh drops it from a pending queue). `NOT_FOUND` and
 * `REFUSED` stay selected with their message, so the reviewer can see what
 * is left and act on it in the review sheet. An id that came back with no
 * entry is treated as a failure too, never as done.
 */
export function applyBatchResults(
  sentIds: readonly string[],
  results: readonly ReviewBatchResult[],
  selection: GridSelection
): BulkOutcome {
  const byId = new Map(
    results.flatMap((result) =>
      result.results.map((item) => [item.observationId, item] as const)
    )
  );
  const selected = new Set(selection.selected);
  const failures = new Map<string, string>();
  let reviewed = 0;
  let alreadyReviewed = 0;
  for (const id of sentIds) {
    const item = byId.get(id);
    if (!item) {
      failures.set(id, MISSING_RESULT_MESSAGE);
      selected.add(id);
      continue;
    }
    if (isReviewBatchItemSettled(item)) {
      if (item.status === 'REVIEWED') reviewed += 1;
      else alreadyReviewed += 1;
      selected.delete(id);
      continue;
    }
    failures.set(id, item.message ?? reviewBatchItemStatusLabels[item.status]);
    selected.add(id);
  }
  return {
    selection: { selected, anchor: selection.anchor },
    failures,
    reviewed,
    alreadyReviewed,
  };
}

/** One line for the toast after a bulk decision. */
export function summariseOutcome(outcome: BulkOutcome): string {
  const parts: string[] = [];
  if (outcome.reviewed > 0) parts.push(`${outcome.reviewed} reviewed`);
  if (outcome.alreadyReviewed > 0) {
    parts.push(`${outcome.alreadyReviewed} already decided`);
  }
  if (outcome.failures.size > 0) {
    parts.push(`${outcome.failures.size} not reviewed`);
  }
  return parts.length > 0 ? parts.join(', ') : 'Nothing was reviewed';
}
