import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { materialsKeys } from '@tornotron/echno-core/materials/hooks';
import { inventoryTransactionKeys } from '@tornotron/echno-core/inventory-transactions/hooks';
import { stockAdjustmentsService } from '@/services/stock-adjustments-service';
import { materialStockKeys } from '@/hooks/materials/material-stock-keys';
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

/**
 * Approves a stock adjustment, which posts its lines to the stock ledger.
 *
 * The approved document comes back on the response and is seeded straight into
 * the detail cache, so the screen shows the posted status and the approver
 * without a refetch. The list and the stock figures the posting moved are
 * invalidated rather than patched: an approval writes inventory transactions
 * and changes material balances, and neither is derivable from this response.
 */
export const useApproveStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stockAdjustmentsService.approve(id),
    onSuccess: (approved) => {
      queryClient.setQueryData(
        stockAdjustmentKeys.detail(approved.id),
        approved
      );
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialsKeys.all });
      queryClient.invalidateQueries({ queryKey: materialStockKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.all });
    },
  });
};
