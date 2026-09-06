import { LeaveRole } from '@/types/leave';

/**
 * Who the client shows leave approval controls to.
 *
 * An approval chain is walked up the employee hierarchy (`employee.manager`),
 * so the person holding a decision is whoever is above the requester on the
 * org chart. That is very often a site supervisor or a foreman, and none of
 * those carry the PROJECT_MANAGER / SITE_MANAGER / HR_ADMIN job titles the
 * client used to read as "may approve". The backend settles it instead: the
 * approval endpoints are gated on tenant membership, and the service accepts
 * the decision only from the request's current approver. These helpers keep
 * the client from second-guessing that answer with a job title.
 */

interface ApprovalActionsInput {
  /** Whether the request is still waiting on an approver. */
  requestIsPending: boolean;
  /**
   * The server's answer for the signed-in caller, from
   * `GET /leave-approvals/web/can-approve`. Undefined while it is in flight.
   */
  serverCanApprove?: boolean;
}

/**
 * Whether to offer Approve, Reject and Delegate on a leave request.
 *
 * The server's answer is the whole of the permission check. A job title cannot
 * add to it (the same endpoint that answers here is the one that refuses the
 * action) and must not subtract from it, which is what hid the buttons from
 * supervisors who were the named approver.
 *
 * @param input - The request's pending state and the server's answer.
 * @returns True when the controls belong on the screen.
 */
export function canActOnLeaveApproval({
  requestIsPending,
  serverCanApprove,
}: ApprovalActionsInput): boolean {
  return requestIsPending && serverCanApprove === true;
}

interface ApprovalQueueInput {
  /**
   * Whether the viewer's job title puts them in the manager cohort. Kept so
   * that a manager with an empty queue still sees the approvals view.
   */
  hasApproverRole: boolean;
  /**
   * How many requests the server says are waiting on this caller, from
   * `GET /leave-requests/web/pending-approvals/count`.
   */
  pendingApprovalsCount?: number;
}

/**
 * Whether the approvals view belongs in front of this viewer.
 *
 * Widening only: everybody who saw it before still sees it, plus anyone the
 * server has actually queued work for.
 *
 * @param input - The viewer's cohort and their queue depth.
 * @returns True when the approvals view should be offered.
 */
export function shouldOfferApprovalQueue({
  hasApproverRole,
  pendingApprovalsCount,
}: ApprovalQueueInput): boolean {
  return hasApproverRole || (pendingApprovalsCount ?? 0) > 0;
}

/** The order the dashboard switcher lists roles in. */
const DASHBOARD_ROLE_ORDER: LeaveRole[] = [
  LeaveRole.EMPLOYEE,
  LeaveRole.MANAGER,
  LeaveRole.ADMIN,
];

interface DashboardRolesInput {
  /** The roles `useLeaveRole` derived from job titles alone. */
  availableRoles: LeaveRole[];
  /** How many requests the server says are waiting on this caller. */
  pendingApprovalsCount?: number;
}

/**
 * The dashboards a viewer can switch between on the leave landing page.
 *
 * The manager dashboard is where the pending approvals list lives, so a
 * supervisor holding real decisions needs a way into it even though their job
 * title never earned them the manager cohort. Their default dashboard is
 * unchanged: the switcher simply gains the entry, with its pending badge.
 *
 * @param input - The title-derived roles and the viewer's queue depth.
 * @returns The roles to offer, in switcher order.
 */
export function leaveDashboardRoles({
  availableRoles,
  pendingApprovalsCount,
}: DashboardRolesInput): LeaveRole[] {
  const offered = new Set(availableRoles);

  if ((pendingApprovalsCount ?? 0) > 0) {
    offered.add(LeaveRole.MANAGER);
  }

  return DASHBOARD_ROLE_ORDER.filter((role) => offered.has(role));
}
