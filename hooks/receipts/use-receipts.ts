import { useQuery } from '@tanstack/react-query';
import { receiptsService } from '@/services/receipts-service';
import { receiptKeys } from './receipt-keys';

export const useReceipts = () =>
  useQuery({
    queryKey: receiptKeys.lists(),
    queryFn: () => receiptsService.getAll(),
  });

export const useReceiptById = (id: number) =>
  useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptsService.getById(id),
    enabled: !!id,
  });
