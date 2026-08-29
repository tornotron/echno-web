import type { StockAdjustment } from '@/types/resource';

/**
 * What a stock adjustment still allows once a decision has been taken on it.
 *
 * A draft can be approved, rejected, edited or deleted. Approving posts its
 * lines to the stock ledger; rejecting records who refused it, when and why.
 * Both decisions are final, and the backend refuses every one of the four
 * actions afterwards, so the screen has to stop offering them rather than let
 * the user find out from a 400.
 *
 * `approval-gate.ts` holds the approve side, which turns on who the caller is
 * as well as what state the document is in. Rejection deliberately does not:
 * see {@link canRejectStockAdjustment}.
 */

/**
 * The width of `stock_adjustment.rejection_reason`, mirrored from the
 * backend's `@Size(max = 500)` on `StockAdjustmentRejectionRequest.reason`.
 * Enforced in the form so an over-long reason is caught while it is being
 * typed rather than returned as a validation error.
 */
export const REJECTION_REASON_MAX_LENGTH = 500;

/** Whether the adjustment's lines are on the stock ledger. */
export function isPosted(adjustment: StockAdjustment): boolean {
  return Boolean(adjustment.processedAt) || adjustment.status === 'processed';
}

/** Whether the adjustment has been refused. */
export function isRejected(adjustment: StockAdjustment): boolean {
  return Boolean(adjustment.rejectedAt) || adjustment.status === 'rejected';
}

/** Whether either decision has been taken, which is what freezes the document. */
export function isDecided(adjustment: StockAdjustment): boolean {
  return isPosted(adjustment) || isRejected(adjustment);
}

interface RejectionGateInput {
  adjustment: StockAdjustment;
  /** Whether the caller holds `system-admin` or a manager-tier role. */
  canReject: boolean;
}

/**
 * Whether the reject action is offered on a stock adjustment.
 *
 * Note what this does not take: the caller's own user id. **Self-rejection is
 * allowed**, so there is no raiser to compare the caller against, and the
 * self-approval branch of `approval-gate.ts` must not be borrowed for it. The
 * backend settled it that way (`rejectingYourOwnAdjustmentIsNotSubjectToTheSelfApprovalRule`)
 * on two grounds: the segregation-of-duties rule exists to put a second pair of
 * eyes on the entry an approval posts, and a rejection posts no entry; and the
 * same person can already `DELETE` their own draft, which is strictly more
 * destructive because it keeps no record of the refusal. Refusing them the
 * rejection would only push them towards the delete.
 *
 * @param input - The document and whether the caller holds a decision role.
 * @returns Whether to put the action on the screen.
 */
export function canRejectStockAdjustment({
  adjustment,
  canReject,
}: RejectionGateInput): boolean {
  // A posted document's lines are on the ledger and the balance has moved. A
  // rejection would claim the correction was refused while the stock figure
  // says it happened, so the backend refuses it and so does the screen.
  // A rejected one is already refused: there is one set of rejection columns,
  // and re-rejecting would overwrite the refusal it exists to keep.
  if (isDecided(adjustment)) {
    return false;
  }

  // Same role gate as approve: system-admin or project-manager. Anyone else is
  // shown no button rather than one that 403s.
  return canReject;
}

/** Whether the Edit and Delete affordances belong on the screen, and if not, why. */
export interface AmendmentGate {
  /** Whether the document can still be changed at all. */
  allowed: boolean;
  /** Why it cannot be, when it cannot. */
  reason?: string;
  /**
   * True when the document was rejected, which is the case where raising a
   * fresh draft from it is the way forward rather than editing it.
   */
  rejected: boolean;
}

/**
 * Whether editing or deleting the adjustment is still possible.
 *
 * `update` and `delete` both carry `requireNotPosted` and `requireNotRejected`
 * on the backend, so the two actions stand or fall together and a decided
 * document refuses both. Offering them anyway leaves a screen whose every
 * button returns a 400.
 *
 * @param adjustment - The document the screen is showing.
 * @returns Whether Edit and Delete belong on it, and the reason when they do not.
 */
export function stockAdjustmentAmendmentGate(
  adjustment: StockAdjustment
): AmendmentGate {
  if (isRejected(adjustment)) {
    return {
      allowed: false,
      rejected: true,
      reason:
        'This adjustment was rejected. The refusal and its reason are the ' +
        'record, so the document cannot be edited or deleted. Raise a fresh ' +
        'adjustment to answer the objection.',
    };
  }

  if (isPosted(adjustment)) {
    return {
      allowed: false,
      rejected: false,
      reason:
        'This adjustment is posted to the stock ledger, so it cannot be ' +
        'edited or deleted. Correct it by raising another adjustment.',
    };
  }

  return { allowed: true, rejected: false };
}

/**
 * Validates a rejection reason against the rules the backend applies to it.
 *
 * `reason` is `@NotBlank @Size(max = 500)`, checked at the edge and again in
 * the service, so both refusals are 400s. The reason is the whole difference
 * between rejecting a document and deleting it: a rejection with none records
 * only that somebody said no, which was already readable from the absent
 * approval.
 *
 * @param reason - What the user has typed so far.
 * @returns The message to show, or undefined when the reason is acceptable.
 */
export function rejectionReasonError(reason: string): string | undefined {
  const trimmed = reason.trim();

  if (trimmed.length === 0) {
    return 'Give a reason. It is what a rejection records that a deletion does not.';
  }

  if (trimmed.length > REJECTION_REASON_MAX_LENGTH) {
    return `A reason is capped at ${REJECTION_REASON_MAX_LENGTH} characters. This one is ${trimmed.length}.`;
  }

  return undefined;
}
