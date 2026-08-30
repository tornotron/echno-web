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
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  CANCEL_REASON_MAX_LENGTH,
  isValidCancelReason,
} from '../invoice-action-gates';

interface IssueInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Invoice number being issued, for the confirmation text. */
  invoiceNumber: string;
  /** The invoice total, so the amount being recognised is on screen. */
  formattedTotal: string;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Confirms issuing a draft invoice.
 *
 * Issuing is not a status change on its own: it posts the receivable to the
 * ledger, debiting Accounts Receivable and crediting the revenue accounts and
 * any GST output. From then on the invoice can take payments, and the only way
 * back is a cancellation that reverses the entry.
 */
export function IssueInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  formattedTotal,
  onConfirm,
  isPending,
}: IssueInvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue invoice</DialogTitle>
          <DialogDescription>
            Issue <strong>{invoiceNumber}</strong> for {formattedTotal}? This
            posts the receivable to the ledger and the invoice starts accepting
            payments. Undoing it means cancelling the invoice, which posts a
            second, reversing entry.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep as draft
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Invoice number being cancelled, for the confirmation text. */
  invoiceNumber: string;
  /** Whether cancelling this one reverses a posted entry, that is, it is issued. */
  postsReversal: boolean;
  /** A condition the server may still refuse on, from the cancel gate. */
  caveat?: string;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

/**
 * Confirms a cancellation and collects the reason the backend requires.
 *
 * The reason is a required request parameter, and on an issued invoice it is
 * written into the reversing entry's description, so it is the only record of
 * why the receivable was backed out.
 */
export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  postsReversal,
  caveat,
  onConfirm,
  isPending,
}: CancelInvoiceDialogProps) {
  const [reason, setReason] = useState('');
  // A successful cancellation closes this dialog from the parent by flipping
  // the `open` prop rather than through onOpenChange, so a clear that only ran
  // on dismissal would leave the previous reason in the box, with the confirm
  // button already enabled, when the next invoice's dialog opens. Resetting on
  // the open transition covers every way the dialog can close.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason('');
  }

  const trimmed = reason.trim();
  const tooLong = trimmed.length > CANCEL_REASON_MAX_LENGTH;

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel invoice</DialogTitle>
          <DialogDescription>
            Cancel <strong>{invoiceNumber}</strong>?{' '}
            {postsReversal
              ? 'This posts a reversing entry that backs the receivable out of the ledger. Both entries stay on it, and a cancellation cannot be undone.'
              : 'The invoice has never been issued, so no ledger entry is posted or reversed. A cancellation cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        {caveat && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {caveat}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="cancel-invoice-reason">Reason</Label>
          <Textarea
            id="cancel-invoice-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this invoice being cancelled?"
            rows={3}
            disabled={isPending}
            aria-invalid={tooLong}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tooLong
              ? `Shorten the reason to ${CANCEL_REASON_MAX_LENGTH} characters or fewer (currently ${trimmed.length}).`
              : `Required. It is recorded on the reversing entry. ${CANCEL_REASON_MAX_LENGTH} characters at most.`}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Keep invoice
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(trimmed)}
            disabled={isPending || !isValidCancelReason(reason)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
