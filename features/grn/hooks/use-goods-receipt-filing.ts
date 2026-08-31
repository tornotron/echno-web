'use client';

/**
 * Filing a goods receipt, including the one refusal the receiver can answer.
 *
 * Since echno-backend#659 a receipt reconciles against the purchase order it
 * cites, and a line that would take a material past the quantity ordered is
 * refused with a 400 unless the payload acknowledges the excess. Read as a
 * generic failure, that refusal is a dead end: the figures that explain it are
 * in the server's message, and the way past it is a second, deliberate filing
 * rather than anything the receiver can change on the form.
 *
 * The flow lives here rather than on the route so the page stays routing and
 * data fetching, and so the two attempts are one piece of code: the
 * acknowledged filing is the first payload sent again, not a payload rebuilt
 * from a form that may have been edited behind the dialog.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useCreateGRN } from '@tornotron/echno-core/grn/hooks';
import { poKeys } from '@tornotron/echno-core/purchase-orders/hooks';
import type { CreateGrnRequest } from '@tornotron/echno-core/grn/types';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import {
  isOverReceiptRefusal,
  overReceiptExplanation,
} from '@/lib/utils/over-receipt';

/** The receipt the server refused, held exactly as it was sent. */
interface RefusedReceipt {
  payload: CreateGrnRequest;
  /** The server's figures, with its instruction to the client removed. */
  explanation: string;
}

export interface GoodsReceiptFiling {
  /** Files a receipt. The refusal, if it comes, lands on `refusal`. */
  fileReceipt: (payload: CreateGrnRequest) => void;
  /** The refused receipt, or `null` while none is awaiting a decision. */
  refusal: RefusedReceipt | null;
  /** Files the refused receipt again, acknowledging the excess. */
  acknowledgeOverReceipt: () => void;
  /** Abandons the refused receipt, leaving the form as it was. */
  dismissRefusal: () => void;
  isPending: boolean;
}

export function useGoodsReceiptFiling(): GoodsReceiptFiling {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearFormDraft = useClearFormDraft();
  const { mutate: createGRN, isPending } = useCreateGRN();
  const [refusal, setRefusal] = useState<RefusedReceipt | null>(null);

  const fileReceipt = useCallback(
    (payload: CreateGrnRequest) => {
      createGRN(payload, {
        onSuccess: (grn) => {
          // The record exists now, so the local draft describes work already
          // done. Left behind it would be offered on the next visit to the form.
          clearFormDraft(FORM_DRAFT_IDS.GOODS_RECEIPT);
          setRefusal(null);

          toast.success('GRN Recorded', {
            description: payload.allowOverReceipt
              ? 'Goods received note recorded as an acknowledged over-receipt. Stock has been updated.'
              : 'Goods received note recorded successfully. Stock has been updated.',
          });
          router.push(routes.resources.goodsReceipts.detail(grn.id).href);
        },
        onError: (error) => {
          // Nothing was written, so every figure on the page was judged against
          // an order the server has just re-read. Whatever else is wrong, the
          // cached order is the thing most likely to be behind: another receipt
          // landing between the two decides this one, and a stale copy would go
          // on offering an outstanding quantity the server has already refused.
          if (payload.purchaseOrderId) {
            queryClient.invalidateQueries({
              queryKey: poKeys.detail(payload.purchaseOrderId),
            });
          }

          if (isOverReceiptRefusal(error)) {
            setRefusal({
              payload,
              explanation: overReceiptExplanation(error),
            });
            return;
          }

          setRefusal(null);
          toast.error(getErrorTitle(error, 'Failed to Record GRN'), {
            description: getErrorMessage(error),
          });
        },
      });
    },
    [createGRN, clearFormDraft, queryClient, router]
  );

  const acknowledgeOverReceipt = useCallback(() => {
    if (!refusal) return;
    fileReceipt({ ...refusal.payload, allowOverReceipt: true });
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
