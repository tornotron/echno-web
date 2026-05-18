import { useQuery } from '@tanstack/react-query';
import { stockAdjustmentsService } from '@/services/stock-adjustments-service';
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
