/**
 * Who the client offers attendance approval controls to.
 *
 * Since the geofence work (echno-backend#681) an attendance day can be routed
 * to a named person: an employee who marks from outside the site boundary
 * gives a reason, and the record stores `geofenceApproverId`. The backend
 * resolves that id through a fallback chain, reporting manager first, then a
 * project manager assigned to the site, and leaves it null when neither
 * resolves, in which case the record-management roles decide as they always
 * have.
 *
 * The chain is walked on the server and its answer is stored on the record, so
 * this file reads `geofenceApproverId` rather than recomputing anything. That
 * matters: the reporting-manager field is set on a small minority of employees
 * today, so which of the three branches produced a given id is not something
 * the client can infer, and does not need to.
 *
 * This is the attendance twin of `features/leave/lib/approval-gate.ts`, for
 * the same reason that file exists. The client used to read "may approve" off
 * a job title, and the person holding a decision is frequently a site
 * supervisor or a foreman who carries none of them.
 */

import type { Attendance } from '@tornotron/echno-core/attendance/types';

/** The parts of an attendance record that decide who may approve it. */
export interface AttendanceApprovalRecord {
  /** The employee the day belongs to. */
  employeeId: number;
  /** Approval workflow state for the day. */
  approvalStatus: Attendance['approvalStatus'];
  /** Whether the day carries a geofence exception awaiting a decision. */
  requiresGeofenceApproval?: boolean;
  /** The employee the backend expects to decide it, when it named one. */
  geofenceApproverId?: number;
}

/** The signed-in viewer, as the client knows them. */
export interface AttendanceApprovalViewer {
  /**
   * The viewer's own employee id, or undefined while it is still resolving.
   *
   * Undefined is not "nobody": it is "not yet known", and the two rules that
   * need an identity treat it as a reason to withhold rather than to allow.
   */
  employeeId?: number;
  /**
   * Whether the viewer holds an attendance record-management role.
   *
   * The client's proxy for the backend's `@attendanceSecurity.canManageRecords()`,
   * which defaults to system-admin, hr-admin and project-manager. This axis is
   * unchanged from before the geofence work; what is added below is the second
   * axis, the record naming someone who holds none of those roles.
   */
  managesRecords: boolean;
}

/**
 * Whether to offer Approve and Reject on an attendance record.
 *
 * The order of the rules is the backend's own, in
 * `AttendanceService.requireActorMayApprove` and
 * `AttendanceSecurityService.canDecideApproval`, and the self-approval refusal
 * has to stay ahead of the role check because that is where it sits there. An
 * employee never decides their own geofence exception whatever roles they
 * hold: the decision exists so that somebody else vouches for the absence, and
 * a project manager approving their own trip away from site is not that.
 *
 * @param record - The record being looked at.
 * @param viewer - The signed-in employee and their role cohort.
 * @returns True when the controls belong on the screen.
 */
export function canDecideAttendanceApproval(
  record: AttendanceApprovalRecord,
  viewer: AttendanceApprovalViewer
): boolean {
  if (record.approvalStatus !== 'pending') return false;

  if (record.requiresGeofenceApproval === true) {
    // Fail closed until the viewer is known. A manager looking at their own
    // exception is refused by the rule below, and that rule cannot fire
    // without an id, so allowing the role check to run first would offer
    // buttons the server answers with a 403.
    if (viewer.employeeId === undefined) return false;
    if (viewer.employeeId === record.employeeId) return false;
  }

  if (viewer.managesRecords) return true;

  return (
    record.geofenceApproverId !== undefined &&
    record.geofenceApproverId === viewer.employeeId
  );
}

/**
 * How many of these records are waiting on an approval decision.
 *
 * Counts the approval state, which is what the surrounding tile claims to
 * show. It previously counted `AttendanceStatus.pendingRegularization`, an
 * attendance status describing a different workflow, so the figure under the
 * words "pending approval" was not the number of records pending approval.
 *
 * @param records - The records in hand.
 * @returns The number awaiting a decision.
 */
export function pendingAttendanceApprovalCount(
  records: readonly AttendanceApprovalRecord[]
): number {
  return records.filter((record) => record.approvalStatus === 'pending').length;
}
