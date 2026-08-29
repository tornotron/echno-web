import { describe, expect, test } from 'bun:test';
import { LeaveStatus } from '@/types/leave';
import type { LeaveRequest } from '@/types/leave';
import { canCancelLeaveRequest, leaveWithdrawalGate } from './withdrawal-gate';

const ME = 7;

/** A pending request belonging to employee 7, the withdrawable base case. */
function request(over: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id: 31,
    requestNumber: 'LR-2026-0031',
    employeeId: ME,
    status: LeaveStatus.PENDING_APPROVAL,
    totalDays: 2,
    ...over,
  } as unknown as LeaveRequest;
}

describe('leaveWithdrawalGate', () => {
  test('the employee may withdraw their own pending request', () => {
    const gate = leaveWithdrawalGate({
      request: request(),
      currentEmployeeId: ME,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(true);
    expect(gate.reason).toBeUndefined();
  });

  test('a draft is withdrawable too, matching the service', () => {
    const gate = leaveWithdrawalGate({
      request: request({ status: LeaveStatus.DRAFT }),
      currentEmployeeId: ME,
    });
    expect(gate.enabled).toBe(true);
  });

  test('someone else looking at the request is offered nothing', () => {
    // The mapping carries isSelfInCurrentTenant and no role escape, so an
    // approver or an HR admin cannot withdraw on the employee's behalf.
    const gate = leaveWithdrawalGate({
      request: request(),
      currentEmployeeId: 9,
    });
    expect(gate.visible).toBe(false);
    expect(gate.enabled).toBe(false);
  });

  test('the action waits rather than guessing while the viewer is unknown', () => {
    const gate = leaveWithdrawalGate({
      request: request(),
      currentEmployeeId: undefined,
    });
    expect(gate.visible).toBe(false);
  });

  test('an approved request is refused, with the reason in place of the button', () => {
    const gate = leaveWithdrawalGate({
      request: request({ status: LeaveStatus.APPROVED }),
      currentEmployeeId: ME,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already approved');
  });

  test('a rejected request is past withdrawing', () => {
    const gate = leaveWithdrawalGate({
      request: request({ status: LeaveStatus.REJECTED }),
      currentEmployeeId: ME,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already rejected');
  });

  test('an already withdrawn request cannot be withdrawn again', () => {
    const gate = leaveWithdrawalGate({
      request: request({ status: LeaveStatus.WITHDRAWN }),
      currentEmployeeId: ME,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already withdrawn');
  });

  test('a cancelled request cannot be withdrawn', () => {
    const gate = leaveWithdrawalGate({
      request: request({ status: LeaveStatus.CANCELLED }),
      currentEmployeeId: ME,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already cancelled');
  });
});

describe('canCancelLeaveRequest', () => {
  test('cancel is offered on approved leave the viewer owns', () => {
    expect(
      canCancelLeaveRequest({
        request: request({ status: LeaveStatus.APPROVED }),
        currentEmployeeId: ME,
      })
    ).toBe(true);
  });

  test('cancel is no longer offered on a pending request', () => {
    // The backend would accept it, which is how a request that was only ever
    // pending came to be recorded as cancelled. Withdraw is the honest verb
    // there, so cancel steps back.
    expect(
      canCancelLeaveRequest({
        request: request({ status: LeaveStatus.PENDING_APPROVAL }),
        currentEmployeeId: ME,
      })
    ).toBe(false);
  });

  test('cancel is not offered on approved leave someone else owns', () => {
    expect(
      canCancelLeaveRequest({
        request: request({ status: LeaveStatus.APPROVED }),
        currentEmployeeId: 9,
      })
    ).toBe(false);
  });
});
