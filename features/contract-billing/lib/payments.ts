import {
  BillPaymentProvider,
  BillPaymentState,
  BillPaymentStatus,
  type BillPayment,
  type BillPayments,
} from '@tornotron/echno-core/contract-billing/types';
import { parseAmountInput } from './format';

export const PAYMENT_STATUS_LABELS: Record<BillPaymentStatus, string> = {
  [BillPaymentStatus.REQUESTED]: 'Waiting for authorization',
  [BillPaymentStatus.AUTHORIZED]: 'Authorized',
  [BillPaymentStatus.PROCESSING]: 'With the provider',
  [BillPaymentStatus.SETTLED]: 'Paid',
  [BillPaymentStatus.FAILED]: 'Failed',
  [BillPaymentStatus.REJECTED]: 'Rejected',
  [BillPaymentStatus.REVERSED]: 'Returned by the bank',
};

export const PAYMENT_STATUS_CLASSES: Record<BillPaymentStatus, string> = {
  [BillPaymentStatus.REQUESTED]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [BillPaymentStatus.AUTHORIZED]:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  [BillPaymentStatus.PROCESSING]:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [BillPaymentStatus.SETTLED]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  [BillPaymentStatus.FAILED]:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  [BillPaymentStatus.REJECTED]:
    'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [BillPaymentStatus.REVERSED]:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export const PAYMENT_STATE_LABELS: Record<BillPaymentState, string> = {
  [BillPaymentState.NOTHING_PAYABLE]: 'Nothing payable',
  [BillPaymentState.UNPAID]: 'Unpaid',
  [BillPaymentState.PART_PAID]: 'Part paid',
  [BillPaymentState.PAID]: 'Paid',
};

export const PAYMENT_STATE_CLASSES: Record<BillPaymentState, string> = {
  [BillPaymentState.NOTHING_PAYABLE]:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [BillPaymentState.UNPAID]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [BillPaymentState.PART_PAID]:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [BillPaymentState.PAID]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
};

/** What the page says about how money moves, by what carries the payment. */
export const PROVIDER_NOTES: Record<BillPaymentProvider, string> = {
  [BillPaymentProvider.MANUAL]:
    'Pay from the bank once a payment is authorized, then record the bank reference here. That records it on the payable.',
  [BillPaymentProvider.FAKE]:
    'Test mode: no money moves. Authorizing sends the payment to a stand-in, and Check status completes it. An amount ending in .13 fails, to try that path.',
  [BillPaymentProvider.RAZORPAY]:
    'Authorizing sends the payment through Razorpay to the bank account on the contract. It updates here when Razorpay reports the outcome, or when you use Check status.',
};

export type PaymentAction = 'authorize' | 'reject' | 'record' | 'sync';

/**
 * What the given reader can do to one payment now. The server holds the same
 * rules; this keeps the page from offering a step it would refuse.
 *
 * An authorized payment is one a provider has not acknowledged, so it can still
 * be rejected. A failed send stays there with its error, and Check status sends
 * it again safely.
 */
export function paymentActions(
  payment: Pick<BillPayment, 'status' | 'provider'>,
  canAuthorize: boolean
): PaymentAction[] {
  if (!canAuthorize) return [];
  switch (payment.status) {
    case BillPaymentStatus.REQUESTED: {
      return ['authorize', 'reject'];
    }
    case BillPaymentStatus.AUTHORIZED: {
      return payment.provider === BillPaymentProvider.MANUAL
        ? ['record', 'reject']
        : ['sync', 'reject'];
    }
    case BillPaymentStatus.PROCESSING: {
      return ['sync'];
    }
    default: {
      return [];
    }
  }
}

/** Why a new payment cannot be raised on this bill, or null when it can. */
export function raiseBlockedReason(view: BillPayments): string | null {
  if (view.paymentState === BillPaymentState.NOTHING_PAYABLE) {
    return 'Nothing is payable on this bill.';
  }
  if (view.paymentState === BillPaymentState.PAID) {
    return 'This bill is fully paid.';
  }
  if (
    view.paymentState !== BillPaymentState.UNPAID &&
    view.paymentState !== BillPaymentState.PART_PAID
  ) {
    return 'A bill can be paid once it has final approval.';
  }
  if (view.inFlight) {
    return 'A payment is in progress. Finish or reject it before raising another.';
  }
  if (view.provider !== BillPaymentProvider.MANUAL && !view.beneficiaryReady) {
    return "Add the contractor's bank account number and IFSC to the sub-contract before paying through the provider.";
  }
  return null;
}

/** Reads the amount typed for a payment: more than zero, two places, no more than is due. */
export function parsePaymentAmount(
  raw: string,
  due: number
): { ok: true; amount: number } | { ok: false; error: string } {
  const amount = parseAmountInput(raw);
  if (amount === undefined || amount === null || amount <= 0) {
    return { ok: false, error: 'Enter an amount above zero.' };
  }
  if (Math.round(amount * 100) / 100 !== amount) {
    return {
      ok: false,
      error: 'Enter the amount to at most two decimal places.',
    };
  }
  if (amount > due) {
    return { ok: false, error: 'That is more than is due on this bill.' };
  }
  return { ok: true, amount };
}
