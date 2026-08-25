import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsService } from '@/services/receipts-service';
import type { Receipt } from '@/types/finance/receipt';
import { receiptKeys } from './receipt-keys';

/** Fetches all receipts for the current organization. */
export const useReceipts = () =>
  useQuery({
    queryKey: receiptKeys.lists(),
    queryFn: () => receiptsService.getAll(),
  });

/**
 * Fetches a single receipt by id. Stays disabled until `id` is a finite positive
 * number, so it is safe to call before the route param resolves.
 */
export const useReceiptById = (id: number) =>
  useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptsService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

/**
 * Creates a receipt and invalidates the receipt list on success so the new row
 * appears without a manual refetch.
 */
export const useCreateReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Receipt>) => receiptsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
};

/**
 * Updates a receipt by id, then invalidates both the list and that receipt's
 * detail cache so both views reflect the change.
 */
export const useUpdateReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Receipt> }) =>
      receiptsService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: receiptKeys.detail(id) });
    },
  });
};

/**
 * Deletes a receipt by id and invalidates the receipt list so the removed row
 * disappears without a manual refetch.
 */
export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => receiptsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
};
