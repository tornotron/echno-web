'use client';

import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { useRejectStockAdjustment } from '@/hooks/stock-adjustments';
import type { StockAdjustment } from '@/types/resource';
import {
  REJECTION_REASON_MAX_LENGTH,
  canRejectStockAdjustment,
  rejectionReasonError,
} from '../decision-gates';

interface RejectStockAdjustmentProps {
  adjustment: StockAdjustment;
  /** Whether the viewer holds `system-admin` or a manager-tier role. */
  canDecide: boolean;
}

/**
 * The Reject action on a stock adjustment, with the form that collects the
 * reason.
 *
 * Renders nothing unless {@link canRejectStockAdjustment} allows it, so a
 * viewer without a decision role, or one looking at a document already posted
 * or already rejected, is shown no button rather than one that fails.
 *
 * The reason is mandatory and capped at {@link REJECTION_REASON_MAX_LENGTH},
 * both of which the backend enforces as 400s. They are applied here so the
 * user is told while typing: the textarea carries the cap and a counter, and
 * the submit stays disabled until there is a reason to send. The message waits
 * for the field to be touched, so the dialog does not open with an error on it.
 */
export function RejectStockAdjustment({
  adjustment,
  canDecide,
}: RejectStockAdjustmentProps) {
  const rejectAdjustment = useRejectStockAdjustment();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const offered = canRejectStockAdjustment({
    adjustment,
    canReject: canDecide,
  });
  const error = rejectionReasonError(reason);
  const showError = touched && error !== undefined;

  function openDialog() {
    setReason('');
    setTouched(false);
    setOpen(true);
  }

  async function submit() {
    setTouched(true);
    if (error) return;

    try {
      await rejectAdjustment.mutateAsync({
        id: adjustment.id,
        reason: reason.trim(),
      });
      setOpen(false);
      toast.success('Stock adjustment rejected', {
        description:
          'The refusal and its reason are on the record. No stock has moved.',
      });
    } catch (mutationError) {
      toast.error('Failed to reject stock adjustment', {
        description: getErrorMessage(mutationError),
      });
    }
  }

  if (!offered) return;

  return (
    <>
      <Button
        variant="outline"
        onClick={openDialog}
        disabled={rejectAdjustment.isPending}
        className="text-red-600 hover:text-red-700"
      >
        {rejectAdjustment.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="mr-2 h-4 w-4" />
        )}
        Reject Adjustment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Reject stock adjustment
            </DialogTitle>
            <DialogDescription>
              Refuse <strong>{adjustment.adjustmentNumber}</strong>. Nothing is
              posted to the stock ledger and no balance moves. The refusal is
              final: a rejected adjustment cannot be edited, deleted or approved
              afterwards, and a corrected count is raised as a fresh adjustment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="rejection-reason"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Reason
            </label>
            <Textarea
              id="rejection-reason"
              rows={4}
              maxLength={REJECTION_REASON_MAX_LENGTH}
              value={reason}
              placeholder="Say what the count sheet does not support, so the next person reading the balance knows why this was turned down."
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={showError}
              aria-describedby="rejection-reason-help"
            />
            <div
              id="rejection-reason-help"
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span
                className={
                  showError
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }
              >
                {showError
                  ? error
                  : 'Required. It is what a rejection records that a deletion does not.'}
              </span>
              <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                {reason.length}/{REJECTION_REASON_MAX_LENGTH}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={rejectAdjustment.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={error !== undefined || rejectAdjustment.isPending}
            >
              {rejectAdjustment.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
