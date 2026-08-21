'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  useSubmitConstructionInvoice,
  useApproveConstructionInvoice,
  useCancelConstructionInvoice,
  useRecordConstructionInvoicePayment,
} from '@tornotron/echno-core/finance/hooks';
import type { ConstructionInvoice } from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { invoiceKeys } from '@/hooks/invoices';
import { toast } from '@/lib/styles/toast-styles';
import { useAuthorization } from '@/hooks/use-authorization';

const showError = (fallback: string) => (error: unknown) => {
  toast.error(getErrorTitle(error, fallback), {
    description: getErrorMessage(error),
  });
};

/**
 * Wires the construction-invoice approval workflow to the echno-core mutation
 * hooks and keeps the web app's local invoice caches in step.
 *
 * The list and detail views read through the app's own `invoiceKeys`, while the
 * core hooks seed and invalidate their own `financeKeys`. Each action therefore
 * layers a per-call `onSuccess` that seeds the returned invoice into the local
 * detail cache and invalidates the local list so both views reflect the new
 * status without a manual refresh. Errors surface as a toast; the server is the
 * final authority on permission, so a 403 becomes an error toast here.
 */
export function useInvoiceWorkflow() {
  const queryClient = useQueryClient();
  const { isSystemAdmin, isManager } = useAuthorization();

  // Approvals are limited to system-admin and manager-tier roles (which include
  // project manager). The backend enforces the same set and 403s otherwise.
  const canManage = isSystemAdmin || isManager;

  const submitMutation = useSubmitConstructionInvoice();
  const approveMutation = useApproveConstructionInvoice();
  const cancelMutation = useCancelConstructionInvoice();
  const recordPaymentMutation = useRecordConstructionInvoicePayment();

  const sync = (updated: ConstructionInvoice) => {
    queryClient.setQueryData(invoiceKeys.detail(updated.id), updated);
    queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
  };

  interface ActionCallbacks {
    onDone?: () => void;
  }

  const submit = (id: string, cb: ActionCallbacks = {}) => {
    submitMutation.mutate(id, {
      onSuccess: (data) => {
        sync(data);
        toast.success('Invoice submitted', {
          description: 'The invoice was sent for approval.',
        });
        cb.onDone?.();
      },
      onError: showError('Failed to submit invoice'),
    });
  };

  const approve = (id: string, cb: ActionCallbacks = {}) => {
    approveMutation.mutate(id, {
      onSuccess: (data) => {
        sync(data);
        toast.success('Invoice approved', {
          description: 'The ledger entry was posted.',
        });
        cb.onDone?.();
      },
      onError: showError('Failed to approve invoice'),
    });
  };

  const cancel = (id: string, reason: string, cb: ActionCallbacks = {}) => {
    cancelMutation.mutate(
      { id, reason },
      {
        onSuccess: (data) => {
          sync(data);
          toast.success('Invoice cancelled', {
            description: 'A reversal entry was posted.',
          });
          cb.onDone?.();
        },
        onError: showError('Failed to cancel invoice'),
      }
    );
  };

  const recordPayment = (
    id: string,
    amount: number,
    cb: ActionCallbacks = {}
  ) => {
    recordPaymentMutation.mutate(
      { id, amount },
      {
        onSuccess: (data) => {
          sync(data);
          toast.success('Payment recorded', {
            description: 'The payment was applied to the invoice.',
          });
          cb.onDone?.();
        },
        onError: showError('Failed to record payment'),
      }
    );
  };

  return {
    canManage,
    submit,
    approve,
    cancel,
    recordPayment,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRecordingPayment: recordPaymentMutation.isPending,
  };
}
