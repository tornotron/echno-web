import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderItemsService } from '@/services/purchase-order-items-service';
import { poItemKeys } from './purchase-order-item-keys';
import { poKeys } from '@/hooks/purchase-orders/use-purchase-orders';
import { toast } from '@/lib/styles/toast-styles';
import { CreatePurchaseOrderItemInput } from '@/types/purchase-orders';

export const useCreatePOItem = (purchaseOrderId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: CreatePurchaseOrderItemInput) =>
      purchaseOrderItemsService.create(item),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: poItemKeys.byPO(purchaseOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: poKeys.detail(purchaseOrderId),
      });
      toast.success('Item added.');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Failed to add item.'),
  });
};

export const useUpdatePOItem = (purchaseOrderId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      item,
    }: {
      id: number;
      item: CreatePurchaseOrderItemInput;
    }) => purchaseOrderItemsService.update(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: poItemKeys.byPO(purchaseOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: poKeys.detail(purchaseOrderId),
      });
      toast.success('Item updated.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update item.'
      ),
  });
};

export const useDeletePOItem = (purchaseOrderId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => purchaseOrderItemsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: poItemKeys.byPO(purchaseOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: poKeys.detail(purchaseOrderId),
      });
      toast.success('Item removed.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove item.'
      ),
  });
};
