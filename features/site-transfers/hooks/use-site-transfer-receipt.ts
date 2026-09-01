'use client';

/**
 * Recording what a lorry brought, including the one refusal the receiver can
 * answer.
 *
 * echno-backend#660 split a transfer that crosses a project boundary into two
 * steps. Creation posts the outbound leg only; the receiving site's stock does
 * not move until somebody there says what turned up. Filing that statement has
 * exactly one refusal a person can act on, and the flow below is the same one
 * the goods receipt uses for its own (see `useGoodsReceiptFiling`), because the
 * two refusals are the same refusal:
 *
 * - **An over-receipt is refused** with a 400 naming the line and the figures.
 *   The way past it is a second, deliberate filing of the same payload with the
 *   acknowledgement set, not anything the receiver can change on the form.
 * - **A shortfall is not refused at all**, and nothing here treats it as a
 *   decision. Eight arriving against ten sent asserts nothing false; the gap
 *   comes back on the transfer as an open variance.
 *
 * The two attempts are one piece of code so the acknowledged filing is the
 * first payload sent again, rather than a payload rebuilt from a form that may
 * have been edited behind the dialog.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useReceiveSiteTransfer,
  siteTransferKeys,
} from '@tornotron/echno-core/site-transfers/hooks';
import type { ReceiveSiteTransferRequest } from '@tornotron/echno-core/site-transfers/types';
import { toast } from '@/lib/styles/toast-styles';
import {
  isOverReceiptRefusal,
  overReceiptExplanation,
} from '@/lib/utils/over-receipt';

/** The receipt the server refused, held exactly as it was sent. */
interface RefusedReceipt {
  receipt: ReceiveSiteTransferRequest;
  /** The server's figures, with its instruction to the client removed. */
  explanation: string;
}

export interface SiteTransferReceipt {
  /** Files a receipt. The refusal, if it comes, lands on `refusal`. */
  fileReceipt: (receipt: ReceiveSiteTransferRequest) => void;
  /** The refused receipt, or `null` while none is awaiting a decision. */
  refusal: RefusedReceipt | null;
  /** Files the refused receipt again, acknowledging the excess. */
  acknowledgeOverReceipt: () => void;
  /** Abandons the refused receipt, leaving the form as it was. */
  dismissRefusal: () => void;
  isPending: boolean;
}

/**
 * @param id - Surrogate ID of the transfer being received.
 * @param onRecorded - Run once the server has accepted a receipt, so the caller
 *   can close its own form.
 */
export function useSiteTransferReceipt(
  id: number,
  onRecorded?: () => void
): SiteTransferReceipt {
  const queryClient = useQueryClient();
  const { mutate: receive, isPending } = useReceiveSiteTransfer();
  const [refusal, setRefusal] = useState<RefusedReceipt | null>(null);

  const fileReceipt = useCallback(
    (receipt: ReceiveSiteTransferRequest) => {
      receive(
        { id, receipt },
        {
          onSuccess: (transfer) => {
            setRefusal(null);
            let shortfall = 0;
            for (const item of transfer.items) {
              shortfall += item.inTransitQuantity;
            }
            toast.success('Delivery recorded', {
              description: receipt.allowOverReceipt
                ? 'Recorded as an acknowledged over-receipt. Stock has been added at the receiving site.'
                : shortfall > 0
                  ? 'Stock has been added at the receiving site. What did not arrive is left open on the transfer.'
                  : 'Stock has been added at the receiving site.',
            });
            onRecorded?.();
          },
          onError: (error) => {
            // Nothing was written, and the server has just re-read the transfer
            // to judge this receipt. An over-receipt is judged against what has
            // *already* arrived, so a colleague confirming the same lorry
            // between the two attempts decides this one. A stale cached copy is
            // exactly what would go on offering a quantity the server has
            // already refused, and what would let an acknowledgement be given
            // against figures that have since moved.
            queryClient.invalidateQueries({
              queryKey: siteTransferKeys.detail(id),
            });

            if (isOverReceiptRefusal(error)) {
              setRefusal({
                receipt,
                explanation: overReceiptExplanation(error),
              });
              return;
            }

            setRefusal(null);
            toast.error(getErrorTitle(error, 'Failed to record the delivery'), {
              description: getErrorMessage(error),
            });
          },
        }
      );
    },
    [receive, id, queryClient, onRecorded]
  );

  const acknowledgeOverReceipt = useCallback(() => {
    if (!refusal) return;
    fileReceipt({ ...refusal.receipt, allowOverReceipt: true });
  }, [fileReceipt, refusal]);

  const dismissRefusal = useCallback(() => setRefusal(null), []);

  return {
    fileReceipt,
    refusal,
    acknowledgeOverReceipt,
    dismissRefusal,
    isPending,
  };
}
