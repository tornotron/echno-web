import { describe, expect, test } from 'bun:test';
import {
  canActOnLeaveApproval,
  leaveDashboardRoles,
  shouldOfferApprovalQueue,
} from './approval-gate';
import { LeaveRole } from '@/types/leave';

/**
 * The case the client used to get wrong. A site supervisor sits above the
 * requester in the employee hierarchy, so the approval chain names them the
 * current approver, but they hold none of the manager job titles. The server
 * says yes; the client has to take that answer.
 */
describe('canActOnLeaveApproval', () => {
  test('offers the controls when the server says the caller may act', () => {
    expect(
      canActOnLeaveApproval({ requestIsPending: true, serverCanApprove: true })
    ).toBe(true);
  });

  test('withholds them when the server says no', () => {
    expect(
      canActOnLeaveApproval({ requestIsPending: true, serverCanApprove: false })
    ).toBe(false);
  });

  test('withholds them while the answer is still in flight', () => {
    expect(canActOnLeaveApproval({ requestIsPending: true })).toBe(false);
  });

  test('withholds them once the request has been decided', () => {
    expect(
      canActOnLeaveApproval({ requestIsPending: false, serverCanApprove: true })
    ).toBe(false);
  });
});

describe('shouldOfferApprovalQueue', () => {
  test('offers the queue to a supervisor with requests waiting on them', () => {
    expect(
      shouldOfferApprovalQueue({
        hasApproverRole: false,
        pendingApprovalsCount: 2,
      })
    ).toBe(true);
  });

  test('keeps offering it to a manager whose queue is empty', () => {
    expect(
      shouldOfferApprovalQueue({
        hasApproverRole: true,
        pendingApprovalsCount: 0,
      })
    ).toBe(true);
  });

  test('keeps offering it to a manager before the count arrives', () => {
    expect(shouldOfferApprovalQueue({ hasApproverRole: true })).toBe(true);
  });

  test('leaves it out for an employee with nothing waiting', () => {
    expect(
      shouldOfferApprovalQueue({
        hasApproverRole: false,
        pendingApprovalsCount: 0,
      })
    ).toBe(false);
  });

  test('leaves it out for an employee before the count arrives', () => {
    expect(shouldOfferApprovalQueue({ hasApproverRole: false })).toBe(false);
  });
});

describe('leaveDashboardRoles', () => {
  test('adds the manager dashboard for a supervisor holding decisions', () => {
    expect(
      leaveDashboardRoles({
        availableRoles: [LeaveRole.EMPLOYEE],
        pendingApprovalsCount: 1,
      })
    ).toEqual([LeaveRole.EMPLOYEE, LeaveRole.MANAGER]);
  });

  test('leaves an employee with an empty queue on their own dashboard', () => {
    expect(
      leaveDashboardRoles({
        availableRoles: [LeaveRole.EMPLOYEE],
        pendingApprovalsCount: 0,
      })
    ).toEqual([LeaveRole.EMPLOYEE]);
  });

  test('takes nothing away from an admin', () => {
    expect(
      leaveDashboardRoles({
        availableRoles: [
          LeaveRole.EMPLOYEE,
          LeaveRole.MANAGER,
          LeaveRole.ADMIN,
        ],
        pendingApprovalsCount: 0,
      })
    ).toEqual([LeaveRole.EMPLOYEE, LeaveRole.MANAGER, LeaveRole.ADMIN]);
  });

  test('keeps the switcher in its usual order', () => {
    expect(
      leaveDashboardRoles({
        availableRoles: [LeaveRole.ADMIN, LeaveRole.EMPLOYEE],
        pendingApprovalsCount: 3,
      })
    ).toEqual([LeaveRole.EMPLOYEE, LeaveRole.MANAGER, LeaveRole.ADMIN]);
  });
});
