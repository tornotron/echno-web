import { useQuery } from '@tanstack/react-query';
import { purchaseOrderItemsService } from '@/services/purchase-order-items-service';
import { poItemKeys } from './purchase-order-item-keys';

export const usePOItemsByPurchaseOrder = (purchaseOrderId: number) =>
  useQuery({
    queryKey: poItemKeys.byPO(purchaseOrderId),
    queryFn: () =>
      purchaseOrderItemsService.getByPurchaseOrder(purchaseOrderId),
    enabled: !!purchaseOrderId,
  });

export const usePOItem = (id: number) =>
  useQuery({
    queryKey: poItemKeys.detail(id),
    queryFn: () => purchaseOrderItemsService.getById(id),
    enabled: !!id,
  });
