import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { stockAdjustmentsService } from '@/services/stock-adjustments-service';
import type { StockAdjustmentSubmitData } from '@/features/stock-adjustments/components/stock-adjustment-form';
import { stockAdjustmentKeys } from './stock-adjustment-keys';

export const useStockAdjustments = () =>
  useQuery({
    queryKey: stockAdjustmentKeys.lists(),
    queryFn: () => stockAdjustmentsService.getAll(),
  });

export const useStockAdjustment = (id: number) =>
  useQuery({
    queryKey: stockAdjustmentKeys.detail(id),
    queryFn: () => stockAdjustmentsService.getById(id),
    enabled: !!id,
  });

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

export const useDeleteStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stockAdjustmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.lists() });
    },
  });
};
