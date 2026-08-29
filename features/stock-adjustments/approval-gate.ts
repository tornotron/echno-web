import type { StockAdjustment } from '@/types/resource';

/**
 * Whether the approve action is offered on a stock adjustment, and if not, why.
 *
 * Approving is the only thing that moves a stock balance from the product, and
 * the backend refuses it in several ways that a client can see coming. Firing
 * the request anyway and surfacing the 4xx tells the user their action failed
 * without telling them what to do instead, so the conditions are evaluated here
 * and the button either does not appear or appears disabled with the reason
 * next to it.
 */
export interface ApprovalGate {
  /** Whether the action belongs on the screen at all. */
  visible: boolean;
  /** Whether it can be pressed. */
  enabled: boolean;
  /** Why it cannot be pressed, when it is visible but disabled. */
  reason?: string;
  /**
   * True when the approver raised the document and is going through on the
   * `system-admin` break-glass exception. The posting is allowed, and the
   * ledger entries record it as a self-approval, so the screen says so first.
   */
  selfApproval: boolean;
}

interface ApprovalGateInput {
  adjustment: StockAdjustment;
  /**
   * The caller's backend user id, from `GET /user/web`. This is a `User` id and
   * not an `Employee` id: `submittedBy` is stamped from the session with
   * `UserContextService.getCurrentUserId()`, so the two are only comparable on
   * the user side.
   */
  currentUserId?: number;
  /** Whether the caller holds `system-admin` or a manager-tier role. */
  canApprove: boolean;
  /** Whether the caller holds `system-admin`, the break-glass role. */
  isSystemAdmin: boolean;
}

const HIDDEN: ApprovalGate = {
  visible: false,
  enabled: false,
  selfApproval: false,
};

function refuse(reason: string, selfApproval = false): ApprovalGate {
  return { visible: true, enabled: false, reason, selfApproval };
}

/**
 * Applies the backend's approval rules to a document the client already holds.
 *
 * The order matches `StockAdjustmentService.approve` so the reason shown is the
 * one the server would give: posted, then the raiser, then the project, then
 * the lines.
 *
 * @param input - The document, the caller's identity and the caller's roles.
 * @returns Whether to show the action, whether to enable it, and the reason.
 */
export function stockAdjustmentApprovalGate({
  adjustment,
  currentUserId,
  canApprove,
  isSystemAdmin,
}: ApprovalGateInput): ApprovalGate {
  // A posted document is frozen. There is nothing left to approve, so the
  // action is gone rather than disabled.
  if (adjustment.processedAt || adjustment.status === 'processed') {
    return HIDDEN;
  }

  // Approval is restricted to system-admin and project-manager. Someone who
  // cannot approve should not be shown a button that only ever 403s.
  if (!canApprove) {
    return HIDDEN;
  }

  // Until the caller's own id has loaded there is no way to tell a
  // self-approval from an ordinary one, and guessing either way is worse than
  // waiting.
  if (!currentUserId) {
    return refuse('Checking who raised this adjustment.');
  }

  const isRaiser =
    adjustment.submittedBy !== undefined &&
    adjustment.submittedBy !== 0 &&
    adjustment.submittedBy === currentUserId;

  // Segregation of duties: an approval is the second pair of eyes on the
  // movement it posts, so it has to come from someone other than the raiser.
  // A system administrator is the one exception and it is recorded as such.
  if (isRaiser && !isSystemAdmin) {
    return refuse(
      'You raised this adjustment. An approval has to come from someone else, ' +
        'or from a system administrator.'
    );
  }

  const selfApproval = isRaiser;

  if (!adjustment.projectId) {
    return refuse(
      'This adjustment names no project, so there is no balance for it to ' +
        'correct. Set a project on it before approving.',
      selfApproval
    );
  }

  if (adjustment.lineItems.length === 0) {
    return refuse('This adjustment has no line items, so there is nothing to post.', selfApproval);
  }

  // Every line posts against one material's balance, so a line that names none
  // cannot be posted at all.
  if (adjustment.lineItems.some((item) => !item.materialId)) {
    return refuse(
      'A line on this adjustment names no material. Edit it and choose the ' +
        'material each line adjusts.',
      selfApproval
    );
  }

  return { visible: true, enabled: true, selfApproval };
}
