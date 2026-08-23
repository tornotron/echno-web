import { useQuery } from '@tanstack/react-query';
import { receiptsService } from '@/services/receipts-service';
import { receiptKeys } from './receipt-keys';

/** Fetches all receipts for the current organization. */
export const useReceipts = () =>
  useQuery({
    queryKey: receiptKeys.lists(),
    queryFn: () => receiptsService.getAll(),
  });

/**
 * Fetches a single receipt by id. Stays disabled until `id` is truthy, so it is
 * safe to call before the route param resolves.
 */
export const useReceiptById = (id: number) =>
  useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptsService.getById(id),
    enabled: !!id,
  });
