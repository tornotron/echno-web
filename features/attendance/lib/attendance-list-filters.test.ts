/**
 * What the filter bar asks the server for.
 *
 * The two geofence filters are the point. `held` is the one that selects: a
 * check-in creates every record `PENDING` and nothing moves it until somebody
 * decides, so a pending decision describes nearly every row on the day while a
 * held day describes the few marked away from the site boundary. Both are
 * server-side, so a mistake here is not a cosmetic one; the list simply answers
 * a different question than the one on screen.
 *
 * Three shapes are pinned, none of which `tsc` sees:
 *
 * - `withinBoundary` collapsed into "no filter". `requiresApproval: false` is a
 *   question, and sending nothing instead returns every day under a control the
 *   user has visibly set.
 * - The two folded into one four-valued control. They are independent so that
 *   "held, and already approved" stays askable, and each still typechecks alone.
 * - A filter that has been set leaking into the request when it reads `all`.
 */
import { describe, expect, test } from 'bun:test';

import {
  attendanceListParamsFrom,
  type AttendanceFilterState,
} from './attendance-list-filters';

function filters(
  overrides: Partial<AttendanceFilterState> = {}
): AttendanceFilterState {
  return {
    projectFilter: '4',
    date: '2026-09-07',
    statusFilter: 'all',
    geofenceHoldFilter: 'all',
    decisionFilter: 'all',
    search: '',
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

describe('the days held for a geofence decision', () => {
  test('are asked for by requiresApproval', () => {
    expect(
      attendanceListParamsFrom(filters({ geofenceHoldFilter: 'held' }))
    ).toMatchObject({ requiresApproval: true });
  });

  test('have an opposite that is sent, not dropped', () => {
    const params = attendanceListParamsFrom(
      filters({ geofenceHoldFilter: 'withinBoundary' })
    );

    expect(params?.requiresApproval).toBe(false);
  });

  test('are unfiltered when the control reads all', () => {
    expect(
      attendanceListParamsFrom(filters())?.requiresApproval
    ).toBeUndefined();
  });
});

describe('the approval decision filter', () => {
  test('passes the decision through', () => {
    expect(
      attendanceListParamsFrom(filters({ decisionFilter: 'approved' }))
    ).toMatchObject({ approvalStatus: 'approved' });

    expect(
      attendanceListParamsFrom(filters({ decisionFilter: 'rejected' }))
    ).toMatchObject({ approvalStatus: 'rejected' });
  });

  test('is unset when the control reads all', () => {
    expect(
      attendanceListParamsFrom(filters())?.approvalStatus
    ).toBeUndefined();
  });

  test('is independent of the held filter', () => {
    // "Held, and already approved": the one question a single four-valued
    // control could not put to the server.
    const params = attendanceListParamsFrom(
      filters({ geofenceHoldFilter: 'held', decisionFilter: 'approved' })
    );

    expect(params?.requiresApproval).toBe(true);
    expect(params?.approvalStatus).toBe('approved');
  });
});

describe('the rest of the filter bar', () => {
  test('defers the query until a project is chosen', () => {
    // Regression guard: the endpoint is scoped to one project, so there is no
    // request to make and the hook is passed null rather than a project id of
    // NaN.
    expect(attendanceListParamsFrom(filters({ projectFilter: 'all' }))).toBe(
      null
    );
  });

  test('carries the search, page and status it always did', () => {
    // Regression guard on the params the page built inline before the two
    // filters were added, the 1-based pager included.
    expect(
      attendanceListParamsFrom(
        filters({
          statusFilter: 'halfDay',
          search: 'ravi',
          page: 3,
          pageSize: 50,
        })
      )
    ).toMatchObject({
      projectId: 4,
      date: '2026-09-07',
      status: 'halfDay',
      search: 'ravi',
      page: 2,
      size: 50,
    });
  });
});
