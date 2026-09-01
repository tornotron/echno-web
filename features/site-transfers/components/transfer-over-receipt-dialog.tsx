'use client';

/**
 * The second act on a transfer over-receipt.
 *
 * The same shape as the goods receipt's dialog, deliberately: echno-backend#660
 * followed #659's precedent on this question, so the client follows it too
 * rather than inventing a second way of asking. The receipt has already been
 * refused once by the time this opens, the server's figures are read out rather
 * than summarised, and the confirm says what it will write.
 *
 * The one thing it does not offer is anything about a shortfall. Recording less
 * than was sent is accepted with no acknowledgement at all, and a dialog that
 * lumped the two together would turn an honest short delivery into a decision
 * somebody has to defend.
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

interface TransferOverReceiptDialogProps {
  /** Open once the server has refused the receipt, never before. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The server's figures, verbatim apart from its instruction to the client. */
  explanation: string;
  /** Files the same receipt again, this time acknowledging the excess. */
  onAcknowledge: () => void;
  isPending: boolean;
}

export function TransferOverReceiptDialog({
  open,
  onOpenChange,
  explanation,
  onAcknowledge,
  isPending,
}: TransferOverReceiptDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            More arrived than this transfer sent
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-foreground">{explanation}</p>
              <p>
                Nothing has been recorded and no stock has moved. If a quantity
                was mistyped, go back and correct it.
              </p>
              <p>
                If the lorry really did bring more than was sent, recording it
                is the honest option: the excess is added at the receiving site,
                which is where the material is standing whether it is recorded
                or not.
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
