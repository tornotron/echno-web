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
