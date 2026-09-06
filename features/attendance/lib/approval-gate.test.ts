import { describe, expect, test } from 'bun:test';
import {
  canDecideAttendanceApproval,
  pendingAttendanceApprovalCount,
  type AttendanceApprovalRecord,
  type AttendanceApprovalViewer,
} from './approval-gate';

/** An ordinary pending day for employee 7, with no geofence exception. */
const ordinary: AttendanceApprovalRecord = {
  employeeId: 7,
  approvalStatus: 'pending',
};

/** A pending day for employee 7 routed to their reporting manager, 12. */
const routed: AttendanceApprovalRecord = {
  employeeId: 7,
  approvalStatus: 'pending',
  requiresGeofenceApproval: true,
  geofenceApproverId: 12,
};

const manager: AttendanceApprovalViewer = {
  employeeId: 12,
  managesRecords: false,
};
const recordManager: AttendanceApprovalViewer = {
  employeeId: 40,
  managesRecords: true,
};

describe('the record names who decides, not a job title', () => {
  test('the named approver may decide, holding no management role', () => {
    // The point of the whole change. resolveApprover walks employee.manager
    // first, and a reporting manager is very often a site supervisor who
    // carries none of system-admin, hr-admin or project-manager. Reading the
    // job title alone is what left them with no buttons on a record the
    // backend had routed to them by name.
    expect(canDecideAttendanceApproval(routed, manager)).toBe(true);
  });

  test('a colleague who is neither approver nor record manager may not', () => {
    expect(
      canDecideAttendanceApproval(routed, {
        employeeId: 99,
        managesRecords: false,
      })
    ).toBe(false);
  });

  test('a record manager decides an ordinary record as they always have', () => {
    expect(canDecideAttendanceApproval(ordinary, recordManager)).toBe(true);
  });

  test('a plain employee decides nothing, even a record naming nobody', () => {
    expect(
      canDecideAttendanceApproval(ordinary, {
        employeeId: 99,
        managesRecords: false,
      })
    ).toBe(false);
  });

  test('an unresolved approver leaves the record managers deciding', () => {
    // geofenceApproverId is null when neither the reporting manager nor a
    // project manager on the site could be resolved. That widens who may
    // approve rather than narrowing it, so the record is never stuck.
    expect(
      canDecideAttendanceApproval(
        { ...routed, geofenceApproverId: undefined },
        recordManager
      )
    ).toBe(true);
  });
});

describe('nobody approves their own away-from-site day', () => {
  test('the employee is refused their own exception', () => {
    expect(
      canDecideAttendanceApproval(routed, {
        employeeId: 7,
        managesRecords: false,
      })
    ).toBe(false);
  });

  test('a record manager is refused their own exception', () => {
    // requireActorMayApprove puts this refusal ahead of the role check, so a
    // project manager or an HR admin who marked away from site gets no
    // buttons on their own day. The server answers the call with a 403, and
    // offering the control anyway only produces a failed action.
    expect(
      canDecideAttendanceApproval(
        { ...routed, employeeId: 40 },
        recordManager
      )
    ).toBe(false);
  });

  test('a record manager still decides their own ordinary record', () => {
    // The refusal is scoped to records flagged for a geofence decision. Who
    // may approve an ordinary record is unchanged.
    expect(
      canDecideAttendanceApproval({ ...ordinary, employeeId: 40 }, recordManager)
    ).toBe(true);
  });

  test('an exception withholds the controls while the viewer is unknown', () => {
    // Fail closed: the self-approval rule cannot fire without an id, so
    // running the role check first would offer a record manager buttons on
    // what might be their own record.
    expect(
      canDecideAttendanceApproval(routed, {
        employeeId: undefined,
        managesRecords: true,
      })
    ).toBe(false);
  });
});

describe('a decided record has nothing left to decide', () => {
  test.each(['approved', 'rejected'] as const)('%s offers no controls', (s) => {
    expect(
      canDecideAttendanceApproval(
        { ...routed, approvalStatus: s },
        recordManager
      )
    ).toBe(false);
    expect(
      canDecideAttendanceApproval({ ...routed, approvalStatus: s }, manager)
    ).toBe(false);
  });
});

describe('pendingAttendanceApprovalCount', () => {
  test('counts the approval state and not the attendance status', () => {
    const records: AttendanceApprovalRecord[] = [
      { employeeId: 1, approvalStatus: 'pending' },
      { employeeId: 2, approvalStatus: 'pending' },
      { employeeId: 3, approvalStatus: 'approved' },
      { employeeId: 4, approvalStatus: 'rejected' },
    ];
    expect(pendingAttendanceApprovalCount(records)).toBe(2);
  });

  test('is zero for an empty page', () => {
    expect(pendingAttendanceApprovalCount([])).toBe(0);
  });
});
