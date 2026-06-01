import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderItemsService } from '@/services/purchase-order-items-service';
import { poKeys } from '@/hooks/purchase-orders/purchase-order-keys';
import { toast } from '@/lib/styles/toast-styles';
import {
  CreatePurchaseOrderItemRequest,
  UpdatePurchaseOrderItemRequest,
  PurchaseOrder,
} from '@/types/purchase-orders';

/**
 * PO items module note:
 *
 * No consumer in the codebase reads from `poItemKeys.*` (no `usePOItemsByPurchaseOrder`,
 * no `usePOItem` consumer). All UI reads PO items via the parent's nested
 * `po.items` array (see `features/purchase-orders/components/purchase-order-items-card.tsx`).
 *
 * Therefore these mutations only patch the parent PO entity and invalidate
 * the parent detail key. If a dedicated `usePOItemsByPurchaseOrder` hook is
 * wired up later, restore predicate-based item-list patching at that point.
 */

export const useCreatePOItem = (purchaseOrderId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderItemRequest) =>
      purchaseOrderItemsService.create(dto),
    onSuccess: (newItem) => {
      // POST /purchase-order-items/web → PurchaseOrderItemResponseDto (full).
      // Patch the parent PO's `items` array so the items table updates
      // instantly; invalidate so derived server fields (totalAmount) refetch.
      queryClient.setQueryData<PurchaseOrder>(
        poKeys.detail(purchaseOrderId),
        (old) => (old ? { ...old, items: [...old.items, newItem] } : old)
      );
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
      data,
    }: {
      id: number;
      data: UpdatePurchaseOrderItemRequest;
    }) => purchaseOrderItemsService.update(id, data),
    onSuccess: (updatedItem, { id }) => {
      // PATCH /purchase-order-items/web → PurchaseOrderItemResponseDto (full).
      // Replace in the parent PO's items array; invalidate for derived totals.
      queryClient.setQueryData<PurchaseOrder>(
        poKeys.detail(purchaseOrderId),
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((it) => (it.id === id ? updatedItem : it)),
              }
            : old
      );
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
    onSuccess: (_data, id) => {
      // DELETE /purchase-order-items/web/{id} → ApiResponse (ack).
      // Filter from the parent PO's items array; invalidate for derived totals.
      queryClient.setQueryData<PurchaseOrder>(
        poKeys.detail(purchaseOrderId),
        (old) =>
          old ? { ...old, items: old.items.filter((it) => it.id !== id) } : old
      );
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
