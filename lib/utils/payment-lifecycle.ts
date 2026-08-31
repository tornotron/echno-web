/**
 * What a construction payment voucher will let you do to it.
 *
 * echno-backend#636 gave the voucher a lifecycle it did not have before. A
 * verified voucher is frozen against editing, because an edit would leave the
 * verification stamp attesting to figures nobody checked, and the correction
 * route it names is cancel and raise a replacement. Cancelling became an action
 * of its own with a required reason, and it is now the only route to
 * `CANCELLED`.
 *
 * The refusals arrive as 400s. The point of gathering them here is that a
 * screen should not let a user find them that way: offering an edit on a frozen
 * voucher means the form loads, the user fills it in, and the save fails with
 * everything they typed still on screen and no way to keep it. These predicates
 * are what the screens ask before drawing an action.
 *
 * They are deliberately not a guess at the server's answer in every case. The
 * verify endpoint also refuses the account that raised the voucher, which is
 * segregation of duties rather than a state of the document; that one is not
 * knowable from the voucher alone and is left to the server to say, with its
 * message rendered rather than replaced.
 */

import { ConstructionPaymentVoucherStatus } from '@/types/finance/payment';

/** The parts of a voucher its lifecycle rules are decided on. */
export interface PaymentLifecycleState {
  /** Processing status. `CANCELLED` is the voided one. */
  status: ConstructionPaymentVoucherStatus;
  /** User who verified the voucher, if it has been verified. */
  verifiedBy?: number;
  /** When it was verified. */
  verifiedAt?: string;
}

/**
 * Whether the voucher carries a verification stamp.
 *
 * Both halves are required, which is the condition the detail page already drew
 * the stamp on: a stamp is a person and a time, and half of one is not a
 * verification anybody can read.
 *
 * @param payment - The voucher.
 * @returns True when the voucher has been verified.
 */
export function isPaymentVerified(payment: PaymentLifecycleState): boolean {
  return Boolean(payment.verifiedBy && payment.verifiedAt);
}

/**
 * Whether the voucher has been voided.
 *
 * @param payment - The voucher.
 * @returns True when its status is `CANCELLED`.
 */
export function isPaymentCancelled(payment: PaymentLifecycleState): boolean {
  return payment.status === ConstructionPaymentVoucherStatus.CANCELLED;
}

/**
 * Whether `PUT /finance/construction-payments/web/{id}` will accept an edit.
 *
 * Refused on a verified voucher (the freeze) and on a cancelled one (a voided
 * document has nothing left to edit). Both are visible before the request goes
 * out, so neither is worth discovering through a lost form.
 *
 * @param payment - The voucher.
 * @returns True when the voucher is still editable.
 */
export function canEditPayment(payment: PaymentLifecycleState): boolean {
  return !isPaymentVerified(payment) && !isPaymentCancelled(payment);
}

/**
 * Whether `POST /{id}/cancel` will accept a cancellation.
 *
 * A **verified** voucher can be cancelled, and that is the whole point of the
 * action: voiding a document is not editing the figures its verification
 * attested to, it withdraws the document those figures were on. Cancelling is
 * one-way, so the only voucher that cannot be cancelled is one already
 * cancelled.
 *
 * @param payment - The voucher.
 * @returns True when the voucher can still be voided.
 */
export function canCancelPayment(payment: PaymentLifecycleState): boolean {
  return !isPaymentCancelled(payment);
}

/**
 * Whether `POST /{id}/verify` is worth offering.
 *
 * Refused on a cancelled voucher and on one already verified. Deliberately not
 * gated on any other status: a `FAILED` or `REFUNDED` payment still has figures
 * worth checking, and the backend refuses only `CANCELLED`, which is the one
 * status saying the document itself is void.
 *
 * The third refusal, a caller verifying a voucher they raised themselves, is
 * not decided here. It depends on who is signed in rather than on the document,
 * and the server's wording for it is what a user needs to read.
 *
 * @param payment - The voucher.
 * @returns True when verification is worth offering.
 */
export function canVerifyPayment(payment: PaymentLifecycleState): boolean {
  return !isPaymentCancelled(payment) && !isPaymentVerified(payment);
}

/**
 * Why the voucher cannot be edited, for the line shown in place of the action.
 *
 * @param payment - The voucher.
 * @returns The explanation, or undefined when the voucher is editable.
 */
export function editRefusalReason(
  payment: PaymentLifecycleState
): string | undefined {
  if (isPaymentCancelled(payment)) {
    return 'This voucher was cancelled and can no longer be edited. Raise a replacement instead.';
  }
  if (isPaymentVerified(payment)) {
    return 'This voucher has been verified and can no longer be edited, so the verification cannot end up attesting to figures nobody checked. Cancel it and raise a replacement.';
  }
  return undefined;
}

/**
 * The statuses an edit form may offer.
 *
 * Every status except `CANCELLED`. The update endpoint refuses that one
 * outright, pointing at the cancel action instead, so a voucher cannot be
 * voided through a full replacement that also silently changes an amount. A
 * status dropdown built from the whole enum offers an option whose only outcome
 * is a 400.
 *
 * Derived from the enum rather than listed, so a status added later appears here
 * without anyone remembering to add it.
 */
export const settablePaymentStatuses = Object.values(
  ConstructionPaymentVoucherStatus
).filter((status) => status !== ConstructionPaymentVoucherStatus.CANCELLED);
