import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { stockAdjustmentsService } from '@/services/stock-adjustments-service';
import type { StockAdjustmentSubmitData } from '@/features/stock-adjustments/components/stock-adjustment-form';
import { stockAdjustmentKeys } from './stock-adjustment-keys';

/** Fetches all stock adjustments for the current organization. */
export const useStockAdjustments = () =>
  useQuery({
    queryKey: stockAdjustmentKeys.lists(),
    queryFn: () => stockAdjustmentsService.getAll(),
  });

/**
 * Fetches a single stock adjustment by id. Stays disabled until `id` is truthy,
 * so it is safe to call before the route param resolves.
 */
export const useStockAdjustment = (id: number) =>
  useQuery({
    queryKey: stockAdjustmentKeys.detail(id),
    queryFn: () => stockAdjustmentsService.getById(id),
    enabled: !!id,
  });

/**
 * Creates a stock adjustment and invalidates the stock-adjustment list on
 * success so the new row appears without a manual refetch.
 */
export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StockAdjustmentSubmitData) =>
      stockAdjustmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.lists() });
    },
  });
};

/**
 * Updates a stock adjustment by id, then invalidates both the list and that
 * adjustment's detail cache so both views reflect the change.
 */
export const useUpdateStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: StockAdjustmentSubmitData;
    }) => stockAdjustmentsService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: stockAdjustmentKeys.detail(id),
      });
    },
  });
};

/**
 * Deletes a stock adjustment by id and invalidates the stock-adjustment list so
 * the removed row disappears without a manual refetch.
 */
export const useDeleteStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stockAdjustmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.lists() });
    },
  });
};
