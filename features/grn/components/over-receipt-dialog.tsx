'use client';

/**
 * The second act on an over-receipt.
 *
 * echno-backend#659 refuses a receipt that would take a material past the
 * quantity its order asked for, and names the order, the quantity ordered, the
 * quantity already received and the quantity now offered. Those figures are the
 * whole point of the refusal: it exists to catch a mistyped digit, and only a
 * person holding the delivery note can tell a typo from a lorry that really did
 * bring more.
 *
 * So this is not a warning with a dismiss. The receipt has already been refused
 * once by the time it opens, the figures are read out rather than summarised,
 * and the confirm says what it will write: the excess is recorded and the note
 * is marked as one somebody let through. The alternative is left as the plain
 * way out, because on the balance of deliveries a wrong digit is the likelier
 * of the two.
 */

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
import { Loader2 } from 'lucide-react';

interface OverReceiptDialogProps {
  /** Open once the server has refused the receipt, never before. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The server's figures, verbatim apart from its instruction to the client. */
  explanation: string;
  /** Files the same receipt again, this time acknowledging the excess. */
  onAcknowledge: () => void;
  isPending: boolean;
}

export function OverReceiptDialog({
  open,
  onOpenChange,
  explanation,
  onAcknowledge,
  isPending,
}: OverReceiptDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            This receipt is more than the order asked for
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-foreground">{explanation}</p>
              <p>
                Nothing has been recorded and stock has not moved. If a quantity
                was mistyped, go back and correct it.
              </p>
              <p>
                If the delivery really was larger than the order, recording it is
                the honest option: the excess is added to the order and this
                receipt is marked as an over-receipt somebody accepted, which
                stays on the document for whoever reads it later.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Go back and check
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // The default closes the dialog on click. It has to stay open
              // while the second request is in flight, or a failure of that
              // request has nowhere to report to and the receipt disappears.
              event.preventDefault();
              onAcknowledge();
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record the excess
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
