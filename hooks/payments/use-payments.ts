import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments-service';
import type {
  CreateConstructionPaymentRequest,
  UpdateConstructionPaymentRequest,
} from '@tornotron/echno-core/finance/types';
import { paymentKeys } from './payment-keys';

export const usePayments = () =>
  useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: () => paymentsService.getAll(),
  });

export const usePaymentById = (id: string) =>
  useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsService.getById(id),
    enabled: !!id,
  });

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
