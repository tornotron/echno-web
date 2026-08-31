'use client';

/**
 * The two lifecycle actions on a construction payment voucher: verify, and
 * cancel with a reason.
 *
 * Both endpoints existed before either had a screen. `POST /{id}/verify`
 * shipped in echno-backend#631 and nothing has ever called it, so a voucher
 * that had been verified said so and one that had not offered no way to become
 * one. `POST /{id}/cancel` shipped in #636 alongside a freeze on editing a
 * verified voucher, which left the product briefly unable to either edit or
 * cancel one.
 *
 * Which action is offered is decided from the voucher's own state, in
 * `lib/utils/payment-lifecycle`, so a refusal the client can see coming is not
 * something a user discovers through a 4xx. What is left to the server is the
 * one refusal the document cannot answer: verify is also refused for the
 * account that raised the voucher, which is segregation of duties rather than a
 * state, and its wording is worth reading rather than replacing.
 */

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Ban, Loader2, ShieldCheck } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { useCancelPayment, useVerifyPayment } from '@/hooks/payments';
import {
  canCancelPayment,
  canVerifyPayment,
  type PaymentLifecycleState,
} from '@/lib/utils/payment-lifecycle';

/** The longest reason the backend accepts. */
export const CANCELLATION_REASON_MAX_LENGTH = 1000;

interface PaymentLifecycleActionsProps {
  /** UUID of the voucher. */
  paymentId: string;
  /** The voucher, for deciding which actions it is in a state to accept. */
  payment: PaymentLifecycleState;
}

export function PaymentLifecycleActions({
  paymentId,
  payment,
}: PaymentLifecycleActionsProps) {
  const verifyPayment = useVerifyPayment();
  const cancelPayment = useCancelPayment();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  /**
   * Opens or closes the dialog, discarding the reason on the way out.
   *
   * Every close goes through here, the explicit button included. Closing by
   * setting the open state directly is the mistake: the reason then survives,
   * and a reason typed against one voucher and abandoned is sitting in the box,
   * with the confirm already enabled, the next time the dialog opens.
   */
  function setCancelDialogOpen(open: boolean) {
    setCancelOpen(open);
    if (!open) setReason('');
  }

  const trimmedReason = reason.trim();
  const reasonTooLong = trimmedReason.length > CANCELLATION_REASON_MAX_LENGTH;
  const reasonIsUsable = trimmedReason !== '' && !reasonTooLong;

  function handleVerify() {
    verifyPayment.mutate(
      { id: paymentId },
      {
        onSuccess: () => toast.success('Payment verified'),
        // Three refusals arrive as the same status and mean different things:
        // the voucher is cancelled, it is already verified, and the caller
        // raised it themselves. Only the last is a rule about the person, and
        // "Failed to verify" would read as a bug rather than as the segregation
        // of duties it is.
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Verification failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  function handleCancel() {
    if (!reasonIsUsable) return;
    cancelPayment.mutate(
      { id: paymentId, reason: trimmedReason },
      {
        onSuccess: () => {
          toast.success('Payment cancelled');
          setCancelDialogOpen(false);
        },
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Cancellation failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  return (
    <>
      {canVerifyPayment(payment) && (
        <Button
          variant="outline"
          onClick={handleVerify}
          disabled={verifyPayment.isPending}
        >
          {verifyPayment.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          Verify
        </Button>
      )}

      {canCancelPayment(payment) && (
        <Button variant="destructive" onClick={() => setCancelOpen(true)}>
          <Ban className="mr-2 h-4 w-4" />
          Cancel voucher
        </Button>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel payment voucher</DialogTitle>
            <DialogDescription>
              This voids the voucher and cannot be undone. Raise a replacement
              alongside it if the payment still needs to be made.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancellation-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="What was wrong with this voucher?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={CANCELLATION_REASON_MAX_LENGTH}
              required
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Required. A voided voucher that does not say what was wrong with
              it explains nothing, and on a verified voucher this is the only
              record of why the verification was set aside.
            </p>
            {reasonTooLong && (
              <p className="text-destructive text-xs">
                Keep the reason to {CANCELLATION_REASON_MAX_LENGTH} characters
                or fewer.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelPayment.isPending}
            >
              Keep voucher
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!reasonIsUsable || cancelPayment.isPending}
            >
              {cancelPayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
