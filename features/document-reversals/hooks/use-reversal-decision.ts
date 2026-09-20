'use client';

/**
 * The approver's decision flow: which request is being decided and how,
 * the mutation behind each decision, and the toasts that report it.
 */
import { useCallback, useState } from 'react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type { DocumentReversal } from '@tornotron/echno-core/document-reversals/types';
import {
  useApproveDocumentReversal,
  useRejectDocumentReversal,
} from '@tornotron/echno-core/document-reversals/hooks';
import { toast } from '@/lib/styles/toast-styles';
import type { ReversalDecision } from '../components/decide-reversal-dialog';

export function useReversalDecision() {
  const approve = useApproveDocumentReversal();
  const reject = useRejectDocumentReversal();
  const [target, setTarget] = useState<DocumentReversal | null>(null);
  const [decision, setDecision] = useState<ReversalDecision | null>(null);

  const open = useCallback(
    (reversal: DocumentReversal, next: ReversalDecision) => {
      setTarget(reversal);
      setDecision(next);
    },
    []
  );

  const close = useCallback(() => {
    setTarget(null);
    setDecision(null);
  }, []);

  const onApprove = useCallback(
    (reversal: DocumentReversal) => {
      approve.mutate(reversal.id, {
        onSuccess: (approved) => {
          close();
          toast.success('Reversal approved', {
            description: approved.reversalReference
              ? `The stock movements were undone under ${approved.reversalReference} and the stores have been told.`
              : 'The document is marked reversed.',
          });
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Could not approve the reversal'), {
            description: getErrorMessage(error),
          });
        },
      });
    },
    [approve, close]
  );

  const onReject = useCallback(
    (reversal: DocumentReversal, reason: string) => {
      reject.mutate(
        { id: reversal.id, dto: { reason } },
        {
          onSuccess: () => {
            close();
            toast.success('Reversal rejected', {
              description: 'The requester has been told, with your reason.',
            });
          },
          onError: (error) => {
            toast.error(getErrorTitle(error, 'Could not reject the reversal'), {
              description: getErrorMessage(error),
            });
          },
        }
      );
    },
    [reject, close]
  );

  return {
    target,
    decision,
    open,
    close,
    onApprove,
    onReject,
    isPending: approve.isPending || reject.isPending,
  };
}
