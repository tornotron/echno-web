import { LeaveStatus } from '@/types/leave';
import type { LeaveRequest } from '@/types/leave';

/**
 * Whether the withdraw action is offered on a leave request, and if not, why.
 *
 * Withdrawing is how an employee retracts a request nobody has acted on yet,
 * and it is the only route to the WITHDRAWN status. The backend refuses it in
 * two ways a client can see coming: the caller is not the employee the request
 * belongs to, and the request has moved past the point where it can be pulled
 * back. Both are evaluated here so the control is absent or disabled with the
 * reason beside it, rather than firing a request that was going to be refused.
 */
export interface WithdrawalGate {
  /** Whether the action belongs on the screen at all. */
  visible: boolean;
  /** Whether it can be pressed. */
  enabled: boolean;
  /** Why it cannot be pressed, when it is visible but disabled. */
  reason?: string;
}

interface WithdrawalGateInput {
  request: LeaveRequest;
  /**
   * The viewer's own employee id. `withdraw` is gated on
   * `@orgSecurity.isSelfInCurrentTenant(#employeeId)` with no role escape, so
   * this is the whole of the permission check.
   */
  currentEmployeeId?: number;
}

const HIDDEN: WithdrawalGate = { visible: false, enabled: false };

/** The two statuses `LeaveRequestService.withdrawRequest` accepts. */
const WITHDRAWABLE = new Set<LeaveStatus>([
  LeaveStatus.DRAFT,
  LeaveStatus.PENDING_APPROVAL,
]);

/** How each status reads in the refusal sentence. */
const STATUS_WORDING: Record<LeaveStatus, string> = {
  [LeaveStatus.DRAFT]: 'a draft',
  [LeaveStatus.PENDING_APPROVAL]: 'pending approval',
  [LeaveStatus.APPROVED]: 'already approved',
  [LeaveStatus.REJECTED]: 'already rejected',
  [LeaveStatus.CANCELLED]: 'already cancelled',
  [LeaveStatus.WITHDRAWN]: 'already withdrawn',
};

/**
 * Applies the backend's withdrawal rules to a request the client already holds.
 *
 * @param input - The request and the viewer's employee id.
 * @returns Whether to show the action, whether to enable it, and the reason.
 */
export function leaveWithdrawalGate({
  request,
  currentEmployeeId,
}: WithdrawalGateInput): WithdrawalGate {
  // Withdrawal is strictly self-service. The mapping carries
  // isSelfInCurrentTenant and nothing else, so an HR admin or an approver
  // looking at someone else's request gets no button rather than one that
  // 403s: only the employee can retract their own request.
  if (!currentEmployeeId || request.employeeId !== currentEmployeeId) {
    return HIDDEN;
  }

  if (!WITHDRAWABLE.has(request.status)) {
    return {
      visible: true,
      enabled: false,
      reason: `This request is ${STATUS_WORDING[request.status]}, so it can no longer be withdrawn.`,
    };
  }

  return { visible: true, enabled: true };
}

/**
 * Whether Cancel belongs on a request, given that Withdraw now covers the
 * pending case.
 *
 * The backend's `cancelRequest` accepts anything that is not already CANCELLED
 * or REJECTED, pending requests included, which is how a request that was only
 * ever pending came to be recorded as cancelled. The two statuses are read
 * differently later: a cancellation says leave that was granted was given back,
 * a withdrawal says it was never granted at all. So the client narrows cancel
 * to the approved case and leaves the pending case to withdraw.
 *
 * @param input - The request and the viewer's employee id.
 * @returns True when the viewer owns an approved request.
 */
export function canCancelLeaveRequest({
  request,
  currentEmployeeId,
}: WithdrawalGateInput): boolean {
  return (
    !!currentEmployeeId &&
    request.employeeId === currentEmployeeId &&
    request.status === LeaveStatus.APPROVED
  );
}
