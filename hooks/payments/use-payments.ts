import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments-service';
import type {
  CreateConstructionPaymentRequest,
  UpdateConstructionPaymentRequest,
} from '@tornotron/echno-core/finance/types';
import { paymentKeys } from './payment-keys';

/** Fetches all construction payments for the current organization. */
export const usePayments = () =>
  useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: () => paymentsService.getAll(),
  });

/**
 * Fetches a single construction payment by id. Stays disabled until `id` is a
 * non-empty string, so it is safe to call before the route param resolves.
 */
export const usePaymentById = (id: string) =>
  useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsService.getById(id),
    enabled: !!id,
  });

/**
 * Creates a construction payment and invalidates the payment list on success
 * so the new row appears without a manual refetch.
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateConstructionPaymentRequest) =>
      paymentsService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};

/**
 * Updates a construction payment by id, then invalidates both the list and
 * that payment's detail cache so both views reflect the change.
 */
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      req,
    }: {
      id: string;
      req: UpdateConstructionPaymentRequest;
    }) => paymentsService.update(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(data.id),
      });
    },
  });
};

/**
 * Records the signed-in user as a voucher's verifier, then invalidates the list
 * and that voucher's detail so the stamp and the withdrawn action both appear.
 *
 * Takes the id and nothing else. The backend stamps the verifier from the
 * session and the time from the clock, which is the point of the action: a
 * caller who could name the verifier could record that a named colleague had
 * checked a payment, at a time of their choosing (echno-backend#631).
 *
 * Verification is refused, with the reason in the `ApiError` message, on three
 * counts that are not interchangeable: the voucher is cancelled, it is already
 * verified, and the caller is the account that raised it. The last is
 * segregation of duties working as designed rather than a fault, so render the
 * server's wording instead of a fixed string.
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => paymentsService.verify(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(data.id),
      });
    },
  });
};

/**
 * Voids a voucher with a reason, then invalidates the list and that voucher's
 * detail so the new status and the recorded reason both appear.
 *
 * This is the only route to a cancelled voucher: echno-backend#636 refuses
 * `status: CANCELLED` on the update. It is also the only way to correct a
 * verified one, since the same change froze those against editing. Cancel, then
 * raise the replacement.
 *
 * The reason is required and non-blank, max 1000 characters. Enforce it in the
 * form rather than sending a blank one to be refused.
 */
export const useCancelPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      paymentsService.cancel(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(data.id),
      });
    },
  });
};
