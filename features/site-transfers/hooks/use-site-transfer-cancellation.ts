'use client';

/**
 * Abandoning a transfer whose lorry never arrived.
 *
 * The sibling of {@link useSiteTransferReceipt}, and deliberately shaped the
 * same way: the caller owns the form, this owns the request, the toasts, and
 * what a refusal leaves on screen.
 *
 * The one thing worth reading twice is what happens on failure. A cancellation
 * is refused when somebody has received against the transfer since the page
 * loaded, which is precisely when the person cancelling most needs to be told
 * why and to still have their reason in front of them. So a failure reports and
 * stops: only success closes the dialog. Holding it open against a dismissal
 * mid-request is {@link CancelTransferDialog}'s job, because the reason being
 * protected is the form's state rather than this hook's.
 */

import { useCallback, useState } from 'react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useCancelSiteTransfer } from '@tornotron/echno-core/site-transfers/hooks';
import { toast } from '@/lib/styles/toast-styles';

export interface SiteTransferCancellation {
  /** Whether the confirmation is on screen. */
  isOpen: boolean;
  /** Opens the confirmation. */
  open: () => void;
  /** Closes the confirmation. */
  close: () => void;
  /** Sends the cancellation. The reason is required by the server. */
  cancelTransfer: (reason: string) => void;
  isPending: boolean;
}

/**
 * @param id - Surrogate ID of the transfer being abandoned.
 * @returns The confirmation's open state and the request that drives it.
 */
export function useSiteTransferCancellation(
  id: number
): SiteTransferCancellation {
  const { mutate, isPending } = useCancelSiteTransfer();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => setIsOpen(false), []);

  const cancelTransfer = useCallback(
    (reason: string) => {
      mutate(
        { id, cancellation: { reason } },
        {
          onSuccess: () => {
            setIsOpen(false);
            toast.success('Transfer cancelled', {
              description: 'The stock has been returned to the sending site.',
            });
          },
          onError: (error) => {
            toast.error(getErrorTitle(error, 'Failed to cancel the transfer'), {
              description: getErrorMessage(error),
            });
          },
        }
      );
    },
    [mutate, id]
  );

  return { isOpen, open, close, cancelTransfer, isPending };
}
