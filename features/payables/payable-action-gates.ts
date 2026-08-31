import { isContractType } from '@/services/payables-service';
import type { Payable } from '@/services/payables-service';

/**
 * What a payable still allows, and what the backend would refuse.
 *
 * Every refusal on `PayableControllerWeb` and `PayableService` is something
 * the client can see coming from the row it already holds and the text in the
 * box. Firing the request anyway and showing the 4xx tells the user their
 * action failed without telling them what to do instead, so the conditions are
 * settled here and the control either does not appear, or appears disabled
 * with the reason beside it.
 *
 * Money is the reason this is worth the care. An amount that is quietly
 * rounded, or a payment that overshoots what is owed, is not a UI defect: it
 * is a wrong number in the ledger.
 */
export interface PayableActionGate {
  /** Whether the action belongs on the screen at all. */
  visible: boolean;
  /** Whether it can be pressed. */
  enabled: boolean;
  /** Why it cannot be pressed, when it is visible but disabled. */
  reason?: string;
}

const HIDDEN: PayableActionGate = { visible: false, enabled: false };

function refuse(reason: string): PayableActionGate {
  return { visible: true, enabled: false, reason };
}

/**
 * The longest payable number the column takes.
 *
 * `@Size(min = 1, max = 50)` on `PayableCreationDto.payableNumber`.
 */
export const PAYABLE_NUMBER_MAX_LENGTH = 50;

/** `@Size(min = 1, max = 100)` on `PayableCreationDto.contractorName`. */
export const CONTRACTOR_NAME_MAX_LENGTH = 100;

/**
 * Decimal places the money columns keep.
 *
 * `amount_recorded` and `amount_paid` are `precision = 15, scale = 2`. A third
 * decimal place is not a validation error: it reaches the driver and is
 * rounded on the way in, so the amount stored is not the amount typed and
 * nothing says so. That is exactly the silent rounding to refuse up front.
 */
export const AMOUNT_SCALE = 2;

/**
 * The largest amount the money columns hold.
 *
 * `precision = 15` with `scale = 2` leaves thirteen digits before the point.
 * Going past it is a numeric overflow at the database rather than a 400, so
 * the user would see a 500 with nothing to act on.
 */
export const AMOUNT_MAX = 9_999_999_999_999.99;

/** How an amount typed into a box was read, or why it could not be. */
export type AmountCheck =
  | { valid: true; amount: number }
  | { valid: false; reason: string };

/**
 * Reads an amount out of a text box, refusing anything the backend or the
 * column would.
 *
 * The scale is counted on the typed text rather than on the parsed number,
 * because a binary float cannot tell 1.10 from 1.1000000000000001 and the
 * question here is what the user wrote.
 *
 * @param raw - The text as typed.
 * @param options - `allowZero` for a limit rather than a payment.
 * @returns The parsed amount, or the reason it was refused.
 */
export function checkAmount(
  raw: string,
  options: { allowZero?: boolean } = {}
): AmountCheck {
  const text = raw.trim();
  if (text === '') {
    return { valid: false, reason: 'Enter an amount.' };
  }

  // Anchored so "1e5", "1,000" and a trailing point are all refused rather
  // than silently reinterpreted by Number().
  if (!/^\d*(?:\.\d+)?$/.test(text) || !/\d/.test(text)) {
    return {
      valid: false,
      reason: 'Enter the amount in digits, for example 12500.00.',
    };
  }

  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > AMOUNT_SCALE) {
    return {
      valid: false,
      reason: `Amounts are kept to ${AMOUNT_SCALE} decimal places. Round it yourself rather than letting the ledger do it.`,
    };
  }

  const amount = Number(text);
  if (!Number.isFinite(amount)) {
    return { valid: false, reason: 'Enter the amount in digits.' };
  }

  if (amount === 0 && !options.allowZero) {
    return { valid: false, reason: 'The amount must be more than zero.' };
  }

  if (amount > AMOUNT_MAX) {
    return {
      valid: false,
      reason: 'That amount is larger than the ledger can hold.',
    };
  }

  return { valid: true, amount };
}

/**
 * Whether a payment of this size can be recorded against this payable.
 *
 * Two refusals sit behind `POST .../{id}/payments`: `@Positive` on the request
 * body and, in `PayableService.recordPayment`, a check that the new paid total
 * does not pass the recorded amount. The second is the one that bites, and the
 * ceiling it enforces is exactly `amountDue` on the row already in hand.
 *
 * The server re-checks under a pessimistic lock, so a payment that races
 * another one is still refused there. This is the answer given before the
 * request, not instead of it.
 *
 * @param raw - The amount as typed.
 * @param payable - The payable being paid.
 * @returns The parsed amount, or the reason it was refused.
 */
export function checkPaymentAmount(
  raw: string,
  payable: Payable
): AmountCheck {
  const parsed = checkAmount(raw);
  if (!parsed.valid) return parsed;

  if (parsed.amount > payable.amountDue) {
    return {
      valid: false,
      reason: `Only ${payable.amountDue.toFixed(AMOUNT_SCALE)} is still owed on this payable, so a larger payment is refused.`,
    };
  }

  return parsed;
}

interface PaymentGateInput {
  payable: Payable;
  /**
   * Whether the caller holds `system-admin` in the current tenant, which is
   * the single role `@PreAuthorize` names on every mapping of
   * `PayableControllerWeb`, the reads included.
   */
  canManage: boolean;
}

/**
 * Whether the record-payment action is offered on a payable, and if not, why.
 *
 * A payable with nothing left owing is hidden rather than disabled: the
 * balance column already says it is settled, and a greyed button beside a zero
 * adds nothing. A payable whose recorded amount is zero or negative is a
 * different case and says so, because it looks payable and is not: every
 * positive payment exceeds the recorded total, so the server refuses all of
 * them.
 *
 * @param input - The payable and whether the caller holds the managing role.
 * @returns Whether to show the action, whether to enable it, and the reason.
 */
export function payablePaymentGate({
  payable,
  canManage,
}: PaymentGateInput): PayableActionGate {
  if (!canManage) {
    return HIDDEN;
  }

  if (payable.amountRecorded <= 0) {
    return refuse(
      'This payable was raised for nothing, so no payment against it can be ' +
        'recorded. Raise a replacement for the amount actually owed.'
    );
  }

  if (payable.amountDue <= 0) {
    return HIDDEN;
  }

  return { visible: true, enabled: true };
}

/**
 * A field of the create form that was rejected, and why.
 *
 * `createdBy` is not a control on the form: it is the signed-in user's
 * employee record, taken from the session. It gets a field of its own anyway
 * so the message lands on its own line rather than under an unrelated input.
 */
export interface PayableDraftProblem {
  field: keyof PayableDraft | 'createdBy';
  reason: string;
}

/** The create form as typed, before anything is parsed. */
export interface PayableDraft {
  payableNumber: string;
  contractorName: string;
  contractType: string;
  amountRecorded: string;
  projectId: string;
  vendorId: string;
  goodsReceivedNoteId: string;
}

interface DraftContext {
  /**
   * The payable numbers already on screen.
   *
   * `PayableService.createPayable` refuses a number already used in the
   * organization with a 409. The rows in hand are one page of them, so this
   * catches the common case of retyping a number the user can see and nothing
   * more; the server still has the final word.
   */
  takenNumbers?: readonly string[];
  /**
   * Whether the signed-in user has an employee record in this organization.
   *
   * `createdBy` on the request is an employee id and is validated against the
   * employee repository, so a user without one cannot raise a payable at all.
   * That is a 404 naming an id the user never chose, so it is caught here.
   */
  hasEmployeeRecord: boolean;
}

/**
 * Every reason the backend would refuse this draft, checked before it is sent.
 *
 * The opening `amountPaid` the creation DTO accepts is deliberately not part
 * of the draft, and it stays out even though `createPayable` now refuses a
 * negative opening payment and one that exceeds the recorded amount. The
 * reason is not that the server would let a bad one through. It is that money
 * paid should arrive by one route: the payment endpoint takes a pessimistic
 * lock on the row before it adds to `amountPaid`, so concurrent payments
 * serialize instead of losing an update, and every rupee is checked against
 * the same ceiling in the same place. An opening amount on create would be a
 * second route to the same column, with its own check in its own place. It
 * cannot race a payment, since the row does not exist yet, so the objection is
 * the duplicated rule rather than the missing lock.
 *
 * `amountRecorded` is required to be positive here, which is the server's rule
 * rather than a stricter one: `createPayable` rejects a null or non-positive
 * recorded amount before it saves. Checking it in the browser is what puts the
 * message beside the field instead of in a toast after a round trip. A payable
 * raised for zero or less could never take a payment anyway, since any
 * positive amount passes its recorded total, so it would be a row that looks
 * like a debt and can never be settled.
 *
 * @param draft - The form as typed.
 * @param context - What is known about the surrounding screen and the user.
 * @returns One problem per bad field, in form order. Empty when it can be sent.
 */
export function checkPayableDraft(
  draft: PayableDraft,
  context: DraftContext
): PayableDraftProblem[] {
  const problems: PayableDraftProblem[] = [];

  const payableNumber = draft.payableNumber.trim();
  if (payableNumber === '') {
    problems.push({
      field: 'payableNumber',
      reason: 'A payable number is required.',
    });
  } else if (payableNumber.length > PAYABLE_NUMBER_MAX_LENGTH) {
    problems.push({
      field: 'payableNumber',
      reason: `Keep the payable number to ${PAYABLE_NUMBER_MAX_LENGTH} characters or fewer.`,
    });
  } else if (
    context.takenNumbers?.some(
      (taken) => taken.toLowerCase() === payableNumber.toLowerCase()
    )
  ) {
    problems.push({
      field: 'payableNumber',
      reason: 'A payable with this number already exists.',
    });
  }

  const contractorName = draft.contractorName.trim();
  if (contractorName === '') {
    problems.push({
      field: 'contractorName',
      reason: 'A contractor name is required.',
    });
  } else if (contractorName.length > CONTRACTOR_NAME_MAX_LENGTH) {
    problems.push({
      field: 'contractorName',
      reason: `Keep the contractor name to ${CONTRACTOR_NAME_MAX_LENGTH} characters or fewer.`,
    });
  }

  if (!isContractType(draft.contractType)) {
    problems.push({
      field: 'contractType',
      reason: 'Choose what this payable is for.',
    });
  }

  const amount = checkAmount(draft.amountRecorded);
  if (!amount.valid) {
    problems.push({ field: 'amountRecorded', reason: amount.reason });
  }

  if (draft.projectId.trim() === '') {
    problems.push({ field: 'projectId', reason: 'Choose a project.' });
  }

  if (!context.hasEmployeeRecord) {
    problems.push({
      field: 'createdBy',
      reason:
        'Your account has no employee record in this organization, so it ' +
        'cannot be recorded as raising a payable.',
    });
  }

  return problems;
}
