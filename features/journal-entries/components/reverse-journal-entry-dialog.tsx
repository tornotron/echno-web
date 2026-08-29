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
  isValidReversalReason,
  REVERSAL_REASON_MAX_LENGTH,
} from '../reversal-gate';

interface ReverseJournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Entry number of the entry being reversed, for the confirmation text. */
  entryNumber: string;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

/**
 * Confirms a journal-entry reversal and collects the reason the backend
 * requires.
 *
 * Two things the accountant has to know before pressing, both of which the
 * ledger will not let them take back:
 *
 * - A reversal does not edit the original. It posts a second, mirror-image
 *   entry and marks the original REVERSED, so both sit on the ledger and both
 *   show in the period.
 * - It cannot be undone. The only way back from a wrong reversal is to reverse
 *   the reversal, which leaves a third entry behind.
 */
export function ReverseJournalEntryDialog({
  open,
  onOpenChange,
  entryNumber,
  onConfirm,
  isPending,
}: ReverseJournalEntryDialogProps) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const tooLong = trimmed.length > REVERSAL_REASON_MAX_LENGTH;

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse journal entry</DialogTitle>
          <DialogDescription>
            Reverse entry <strong>{entryNumber}</strong>? This does not edit the
            entry. It posts a second entry dated today with every debit and
            credit swapped, and marks <strong>{entryNumber}</strong> as
            reversed. Both entries stay on the ledger, and a reversal cannot
            itself be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reversal-reason">Reason</Label>
          <Textarea
            id="reversal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this entry being reversed?"
            rows={3}
            disabled={isPending}
            aria-invalid={tooLong}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tooLong
              ? `Shorten the reason to ${REVERSAL_REASON_MAX_LENGTH} characters or fewer (currently ${trimmed.length}).`
              : `Required. It is recorded on the reversing entry's description. ${REVERSAL_REASON_MAX_LENGTH} characters at most.`}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Keep entry
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(trimmed)}
            disabled={isPending || !isValidReversalReason(reason)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post reversing entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
