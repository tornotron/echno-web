'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import type { Payable } from '@/services/payables-service';
import { checkPaymentAmount } from '../payable-action-gates';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The payable being paid, or null when the dialog is closed. */
  payable: Payable | null;
  /** Formats an amount for display, so the dialog and the table agree. */
  formatAmount: (value: number) => string;
  onConfirm: (paymentAmount: number) => void;
  isPending: boolean;
}

/**
 * Records a payment against a payable.
 *
 * The amount is checked against everything the backend would refuse before the
 * confirm button is enabled: not positive, more decimal places than the column
 * keeps, larger than the ledger holds, or larger than what is still owed. The
 * balance is on screen throughout, and a Pay in full button fills the box with
 * it so the common case cannot be mistyped.
 *
 * Nothing here relaxes the server's own checks. It takes a pessimistic lock and
 * re-runs the overpayment test, so two people paying the same payable at once
 * are still serialised there.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  payable,
  formatAmount,
  onConfirm,
  isPending,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  // A successful payment closes this from the parent by flipping `open` rather
  // than through onOpenChange, so a reset that only ran on dismissal would
  // leave the previous amount in the box when the next payable's dialog opens.
  // Resetting on the open transition covers every way the dialog can close.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAmount('');
  }

  const check = payable ? checkPaymentAmount(amount, payable) : null;
  const touched = amount.trim() !== '';
  const problem = check && !check.valid && touched ? check.reason : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) setAmount('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            {payable
              ? `${payable.payableNumber} to ${payable.contractorName}. ${formatAmount(payable.amountRecorded)} was raised and ${formatAmount(payable.amountPaid)} has been paid, leaving ${formatAmount(payable.amountDue)} owed.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="payment-amount">Amount</Label>
          <div className="flex gap-2">
            <Input
              id="payment-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              aria-invalid={problem !== undefined}
              aria-describedby="payment-amount-help"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !payable}
              onClick={() =>
                payable && setAmount(payable.amountDue.toFixed(2))
              }
            >
              Pay in full
            </Button>
          </div>
          <p
            id="payment-amount-help"
            className={
              problem
                ? 'text-xs text-rose-600 dark:text-rose-400'
                : 'text-xs text-zinc-500 dark:text-zinc-400'
            }
          >
            {problem ??
              (payable
                ? `Up to ${formatAmount(payable.amountDue)}, to two decimal places. A larger payment is refused.`
                : '')}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => check?.valid && onConfirm(check.amount)}
            disabled={isPending || !check?.valid}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
