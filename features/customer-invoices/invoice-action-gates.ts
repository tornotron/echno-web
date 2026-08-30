import { InvoiceStatus } from '@tornotron/echno-core/finance/types';
import type { Invoice } from '@tornotron/echno-core/finance/types';

/**
 * What an accounts-receivable invoice still allows, and what it does not.
 *
 * Both actions on `InvoiceControllerWeb` are guarded, and every guard is
 * something the client can see coming from the row it already holds. Firing
 * the request anyway and showing the 4xx tells the user their action failed
 * without telling them what to do instead, so the conditions are evaluated
 * here and the control either does not appear or appears disabled with the
 * reason beside it.
 *
 * The one rule that cannot be decided here is the source check inside
 * `InvoiceService.cancel`: an invoice a construction invoice raised for itself
 * is refused by name, and nothing on `InvoiceDto` says which those are.
 * See {@link InvoiceActionGate.caveat}.
 */
export interface InvoiceActionGate {
  /** Whether the action belongs on the screen at all. */
  visible: boolean;
  /** Whether it can be pressed. */
  enabled: boolean;
  /** Why it cannot be pressed, when it is visible but disabled. */
  reason?: string;
  /**
   * A condition the server may still refuse on that the row cannot settle, to
   * be shown before the user commits rather than after the request comes back.
   */
  caveat?: string;
}

interface GateInput {
  invoice: Invoice;
  /**
   * Whether the caller holds `system-admin` or a manager-tier role, which is
   * the set `@PreAuthorize` names on every mapping of the controller, the reads
   * included.
   */
  canManage: boolean;
}

const HIDDEN: InvoiceActionGate = { visible: false, enabled: false };

function refuse(reason: string): InvoiceActionGate {
  return { visible: true, enabled: false, reason };
}

/**
 * The longest cancellation reason that is safe to send.
 *
 * Cancelling an issued invoice reverses its journal entry, and the reversing
 * entry's description is built as `"Reversal of " + entryNumber + " - " +
 * reason` into a column of 500 characters. `POST .../cancel` takes the reason
 * as a bare request parameter with no `@Size` on it, so an over-long reason is
 * not answered with a validation error: it reaches the database and fails
 * there. The prefix is at most 45 characters (12 + a 30-character entry number
 * + 3), which leaves 455 that always fit.
 */
export const CANCEL_REASON_MAX_LENGTH = 455;

/** Whether an invoice has had any money applied to it. */
function hasPayments(invoice: Invoice): boolean {
  return invoice.amountPaid > 0;
}

/**
 * Whether the issue action is offered on an invoice.
 *
 * `InvoiceService.issue` accepts a `DRAFT` and nothing else, so every other
 * status is hidden rather than disabled: an invoice that is already issued,
 * paid or cancelled says so in its status, and a disabled Issue button beside
 * that adds nothing.
 *
 * @param input - The invoice and whether the caller holds a managing role.
 * @returns Whether to show the action and whether to enable it.
 */
export function invoiceIssueGate({
  invoice,
  canManage,
}: GateInput): InvoiceActionGate {
  // Issuing is limited to system-admin and project-manager. Anyone else is
  // shown no button rather than one that only ever 403s.
  if (!canManage) {
    return HIDDEN;
  }

  if (invoice.status !== InvoiceStatus.DRAFT) {
    return HIDDEN;
  }

  return { visible: true, enabled: true };
}

/**
 * Whether the cancel action is offered on an invoice, and if not, why.
 *
 * The order matches `InvoiceService.cancelInternal` so the reason shown is the
 * one the server would give: the status first, then the payment guard.
 *
 * The rule this cannot apply is the one ahead of both: an invoice that a
 * construction invoice raised on approval is refused by name, because the two
 * documents share a journal entry and the construction invoice owns it.
 *
 * Core 2.3.0 restored `arInvoiceId`, and it is still not enough to settle this
 * here, because the link points the wrong way. It is a field on
 * `ConstructionInvoice`; `InvoiceDto` carries no back-reference, so a
 * receivables row on its own says nothing about who raised it. Inverting the
 * link client side means holding the `arInvoiceId` of every construction
 * invoice in the tenant, and the only listing there is takes a Spring
 * `Pageable` whose page size defaults to 20, which core's
 * `financeConstructionInvoiceService.getAll` does not raise. An index built
 * from that first page would be silently partial, and it fails in the worse
 * direction: a row whose construction invoice fell outside the page would carry
 * no warning at all, which reads as an assurance that cancelling it is safe.
 * The backend has the inverse in `ConstructionInvoiceRepository`
 * `findByArInvoiceId`, but exposes it on no endpoint and puts nothing from it
 * on the DTO, so an issued invoice is offered the action with the caveat
 * attached rather than being refused on a guess. Cancelling the construction
 * invoice unwinds both sides.
 *
 * @param input - The invoice and whether the caller holds a managing role.
 * @returns Whether to show the action, whether to enable it, and the reason.
 */
export function invoiceCancelGate({
  invoice,
  canManage,
}: GateInput): InvoiceActionGate {
  if (!canManage) {
    return HIDDEN;
  }

  // Already cancelled: the backend refuses a second cancellation, and there is
  // nothing left for the user to do about it either.
  if (invoice.status === InvoiceStatus.CANCELLED) {
    return HIDDEN;
  }

  // Money has been received against it. The backend refuses this whether the
  // status reads PARTIALLY_PAID, PAID, or ISSUED with a payment applied, and
  // the answer in every case is a credit note, so the action stays visible with
  // that reason rather than disappearing.
  if (
    invoice.status === InvoiceStatus.PAID ||
    invoice.status === InvoiceStatus.PARTIALLY_PAID ||
    hasPayments(invoice)
  ) {
    return refuse(
      'This invoice has payments applied, so it cannot be cancelled. Issue a ' +
        'credit note instead.'
    );
  }

  if (invoice.status === InvoiceStatus.DRAFT) {
    return { visible: true, enabled: true };
  }

  return {
    visible: true,
    enabled: true,
    caveat:
      'If this invoice was raised by a construction invoice, it cannot be ' +
      'cancelled on its own: cancel that construction invoice instead, which ' +
      'unwinds both sides.',
  };
}

/**
 * Whether a typed cancellation reason is one the backend can store.
 *
 * The reason is a required request parameter, so an empty box comes back as a
 * 400 naming it, and an over-long one reaches the reversal entry's description
 * column and fails there. Both are settled before the request goes out.
 *
 * @param reason - The raw text from the reason box.
 * @returns True when the trimmed reason is non-empty and short enough.
 */
export function isValidCancelReason(reason: string): boolean {
  const trimmed = reason.trim();
  return trimmed.length > 0 && trimmed.length <= CANCEL_REASON_MAX_LENGTH;
}
