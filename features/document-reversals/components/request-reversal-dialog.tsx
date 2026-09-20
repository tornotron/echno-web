'use client';

/**
 * Asks the document's creator why it should be reversed, then raises the
 * request. The reason is required: the record of why a posted document was
 * undone is what separates a reversal from a deletion.
 *
 * Kept open while the request is in flight, for the reason the transfer
 * cancellation dialog is: a request is refused when something stands against
 * the document, and the refusal has to be readable beside the reason typed.
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

interface RequestReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the document is called on screen, e.g. "site transfer ST-0031". */
  documentLabel: string;
  /** True when approval will move stock back; the copy says so. */
  movesStock: boolean;
  onRequest: (reason: string) => void;
  isPending: boolean;
}

export function RequestReversalDialog({
  open,
  onOpenChange,
  documentLabel,
  movesStock,
  onRequest,
  isPending,
}: RequestReversalDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        {open && (
          <ReasonForm
            documentLabel={documentLabel}
            movesStock={movesStock}
            onRequest={onRequest}
            isPending={isPending}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReasonForm({
  documentLabel,
  movesStock,
  onRequest,
  isPending,
}: Omit<RequestReversalDialogProps, 'open' | 'onOpenChange'>) {
  const [reason, setReason] = useState('');
  const reasonGiven = reason.trim().length > 0;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Request a reversal</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>
              This asks an administrator or project manager to undo{' '}
              {documentLabel}. Nothing changes until they approve it.
            </p>
            <p>
              {movesStock
                ? 'On approval every store this document moved stock through returns to the balance it held before, and the store keepers are told to put the physical stock back. The document stays on record, marked reversed.'
                : 'On approval the document is marked reversed and stays on record. It moves no stock.'}
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div>
        <Label htmlFor="reversal-reason">Reason</Label>
        <Textarea
          id="reversal-reason"
          value={reason}
          maxLength={500}
          placeholder="Why this document should be reversed"
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault();
            onRequest(reason.trim());
          }}
          disabled={isPending || !reasonGiven}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request reversal
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
