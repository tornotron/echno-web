import { useQuery } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments-service';
import { paymentKeys } from './payment-keys';

export const usePayments = () =>
  useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: () => paymentsService.getAll(),
  });

export const usePaymentById = (id: number) =>
  useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsService.getById(id),
    enabled: !!id,
  });
