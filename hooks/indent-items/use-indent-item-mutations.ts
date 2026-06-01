import { useMutation, useQueryClient } from '@tanstack/react-query';
import { indentItemsService } from '@/services/indent-items-service';
import { indentsKeys } from '@/hooks/indents/indent-keys';
import { toast } from '@/lib/styles/toast-styles';
import {
  CreateIndentItemRequest,
  UpdateIndentItemRequest,
  Indent,
} from '@/types/indents';

/**
 * Indent items module note:
 *
 * No consumer in the codebase reads from `indentItemKeys.*`. The indent
 * detail page passes `indent.items` as a prop to `IndentItemsCard`, and
 * other consumers read `indent.items` directly. Therefore these mutations
 * patch the parent indent's `items` array and invalidate the parent for
 * derived field refresh. If a dedicated `useIndentItemsByIndent` hook is
 * wired up later, restore predicate-based item-list patching.
 */

export const useCreateIndentItem = (indentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIndentItemRequest) =>
      indentItemsService.create(dto),
    onSuccess: (newItem) => {
      // POST /indent-items/web → IndentItemDto (full).
      // Patch the parent indent's items array; invalidate for derived fields.
      queryClient.setQueryData<Indent>(indentsKeys.detail(indentId), (old) =>
        old ? { ...old, items: [...old.items, newItem] } : old
      );
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(indentId) });
      toast.success('Item added.');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Failed to add item.'),
  });
};

export const useUpdateIndentItem = (indentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIndentItemRequest }) =>
      indentItemsService.update(id, data),
    onSuccess: (updatedItem, { id }) => {
      // PUT /indent-items/web/{id} → IndentItemDto (full).
      // Replace in the parent indent's items array.
      queryClient.setQueryData<Indent>(indentsKeys.detail(indentId), (old) =>
        old
          ? {
              ...old,
              items: old.items.map((it) => (it.id === id ? updatedItem : it)),
            }
          : old
      );
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(indentId) });
      toast.success('Item updated.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update item.'
      ),
  });
};

export const useDeleteIndentItem = (indentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => indentItemsService.delete(id),
    onSuccess: (_data, id) => {
      // DELETE /indent-items/web/{id} → ApiResponse (ack).
      // Filter from the parent indent's items array.
      queryClient.setQueryData<Indent>(indentsKeys.detail(indentId), (old) =>
        old ? { ...old, items: old.items.filter((it) => it.id !== id) } : old
      );
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(indentId) });
      toast.success('Item removed.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove item.'
      ),
  });
};

export const useMarkIndentItemConverted = (indentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      purchaseOrderNumber,
    }: {
      id: number;
      purchaseOrderNumber: string;
    }) => indentItemsService.markConverted(id, purchaseOrderNumber),
    onSuccess: (updatedItem, { id }) => {
      // PUT /indent-items/web/{id}/mark-converted → IndentItemDto (full).
      // Replace in parent's items array so the converted status flips visibly.
      queryClient.setQueryData<Indent>(indentsKeys.detail(indentId), (old) =>
        old
          ? {
              ...old,
              items: old.items.map((it) => (it.id === id ? updatedItem : it)),
            }
          : old
      );
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(indentId) });
      toast.success('Item marked as converted to PO.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to convert item.'
      ),
  });
};
