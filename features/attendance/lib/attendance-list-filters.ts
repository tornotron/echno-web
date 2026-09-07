/**
 * The filter bar on the project attendance list, turned into request params.
 *
 * Lifted out of the page so the two geofence filters can be tested without
 * rendering it. echno-backend#712 added both to
 * `GET /attendance/web/project/{projectId}` and echno-core#99 taught the client
 * to send them; the page had been assembling its params inline, which is how
 * the parameters were missed on this endpoint in the first place.
 */

import type {
  AttendanceListParams,
  AttendanceStatus,
} from '@tornotron/echno-core/attendance/types';

/**
 * Whether the list is narrowed to the days held for a geofence decision.
 *
 * `withinBoundary` is a question in its own right rather than the absence of
 * one: it asks for the ordinary days, which is not the same answer as `all`.
 */
export type GeofenceHoldFilter = 'all' | 'held' | 'withinBoundary';

/** Where in the approval workflow the listed days should sit. */
export type ApprovalDecisionFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected';

/** The filter-bar state this page holds, as the controls hold it. */
export interface AttendanceFilterState {
  /** Selected project id as a string, or `'all'`. */
  projectFilter: string;
  /** The day being listed, `YYYY-MM-DD`. */
  date: string;
  /** Selected {@link AttendanceStatus} value, or `'all'`. */
  statusFilter: string;
  /** Whether to narrow to the days held for a geofence decision. */
  geofenceHoldFilter: GeofenceHoldFilter;
  /** Whether to narrow to a point in the approval workflow. */
  decisionFilter: ApprovalDecisionFilter;
  /** Free-text search box contents. */
  search: string;
  /** Page number as the pager holds it, 1-based. */
  page: number;
  /** Rows per page. */
  pageSize: number;
}

/**
 * Builds the list request from the filter bar, or `null` when there is nothing
 * to ask for.
 *
 * The endpoint is scoped to one project, so with no project chosen there is no
 * request to make and the caller defers the query rather than sending a
 * meaningless one.
 *
 * The two geofence filters stay separate on purpose. `held` is the selective
 * one: a check-in creates every record `PENDING` and nothing moves it until
 * somebody decides, so a pending decision describes nearly every row while a
 * held day describes the few that were marked away from the site boundary.
 * Keeping them independent is what lets an approver ask for the days that were
 * held and have since been approved, which one four-valued control could not
 * express.
 *
 * @param filters - The filter-bar state.
 * @returns Params for `useAttendanceByProject`, or `null` to defer the query.
 */
export function attendanceListParamsFrom(
  filters: AttendanceFilterState
): AttendanceListParams | null {
  if (filters.projectFilter === 'all') return null;

  return {
    projectId: Number(filters.projectFilter),
    date: filters.date,
    status:
      filters.statusFilter === 'all'
        ? undefined
        : (filters.statusFilter as AttendanceStatus),
    // Undefined only for `all`. `withinBoundary` sends `false`, which is the
    // question "just the ordinary days"; dropping it would answer with every
    // day while the control still read as set.
    requiresApproval:
      filters.geofenceHoldFilter === 'all'
        ? undefined
        : filters.geofenceHoldFilter === 'held',
    approvalStatus:
      filters.decisionFilter === 'all' ? undefined : filters.decisionFilter,
    search: filters.search || undefined,
    page: filters.page - 1, // backend is 0-based
    size: filters.pageSize,
  };
}
