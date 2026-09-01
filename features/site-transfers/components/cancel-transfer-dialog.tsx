'use client';

/**
 * Abandoning a transfer that never arrived.
 *
 * This is not a delete. Cancelling returns the whole sent quantity to the
 * sending project and location it was drawn from, which is a real movement on
 * the ledger, and the reason is kept beside it on the transfer's status trail.
 * That is why the reason is required rather than optional: without it the
 * ledger carries a stock movement nobody can account for six months on.
 *
 * Only a `PENDING` transfer can be cancelled, and the caller gates on that.
 * Once anything has been received, part of the material is standing at the far
 * site and its fate is a stock adjustment rather than a reversal.
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Loader2 } from 'lucide-react';

interface CancelTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being sent back to the sending site, for the person deciding. */
  returningQuantity: number;
  onCancelTransfer: (reason: string) => void;
  isPending: boolean;
}

export function CancelTransferDialog({
  open,
  onOpenChange,
  returningQuantity,
  onCancelTransfer,
  isPending,
}: CancelTransferDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/*
          Mounted only while open, so a reason typed and then abandoned is gone
          on the next open without an effect having to clear it.
        */}
        {open && (
          <CancelReasonForm
            returningQuantity={returningQuantity}
            onCancelTransfer={onCancelTransfer}
            isPending={isPending}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelReasonForm({
  returningQuantity,
  onCancelTransfer,
  isPending,
}: Omit<CancelTransferDialogProps, 'open' | 'onOpenChange'>) {
  const [reason, setReason] = useState('');
  const reasonGiven = reason.trim().length > 0;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Cancel this transfer</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>
              {returningQuantity} will go back to the sending site. This is a
              stock movement, not a deletion: the transfer stays on record as
              cancelled, with your reason beside the movement it caused.
            </p>
            <p>
              Only do this if nothing arrived. Once part of a delivery has been
              taken, the rest is a stock adjustment rather than a reversal.
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div>
        <Label htmlFor="cancel-reason">Reason</Label>
        <Textarea
          id="cancel-reason"
          value={reason}
          maxLength={500}
          placeholder="Why the transfer is being abandoned"
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>
          Keep the transfer
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            // Kept open while the request is in flight, so a refusal has
            // somewhere to report to instead of vanishing with the dialog.
            event.preventDefault();
            onCancelTransfer(reason.trim());
          }}
          disabled={isPending || !reasonGiven}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cancel and return the stock
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
