import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  payablesService,
  type Payable,
  type PayableCreationRequest,
} from '@/services/payables-service';
import { payableKeys } from './payable-keys';

/**
 * Drops every cached payable listing and detail.
 *
 * Called on failure as well as on success. Two people can hold this screen at
 * once, and a payment one of them records leaves the other's row showing an
 * older balance with a payment button still offering the full amount. Refetching
 * on the 400 settles the disagreement in favour of the server rather than
 * leaving a button that fails identically on every further click.
 */
function invalidatePayables(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: payableKeys.all });
}

/**
 * Raises a payable.
 *
 * @returns A TanStack mutation taking the creation request.
 */
export function useCreatePayable() {
  const queryClient = useQueryClient();
  return useMutation<Payable, Error, PayableCreationRequest>({
    mutationFn: (request) => payablesService.create(request),
    onSettled: () => invalidatePayables(queryClient),
  });
}

/**
 * Records a payment against a payable.
 *
 * @returns A TanStack mutation taking the payable id and the amount.
 */
export function useRecordPayablePayment() {
  const queryClient = useQueryClient();
  return useMutation<Payable, Error, { id: number; paymentAmount: number }>({
    mutationFn: ({ id, paymentAmount }) =>
      payablesService.recordPayment(id, paymentAmount),
    onSettled: () => invalidatePayables(queryClient),
  });
}
