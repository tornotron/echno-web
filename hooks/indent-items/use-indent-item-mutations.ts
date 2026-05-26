import { useMutation, useQueryClient } from '@tanstack/react-query';
import { indentItemsService } from '@/services/indent-items-service';
import { indentItemKeys } from './indent-item-keys';
import { indentsKeys } from '@/hooks/indents/indent-keys';
import { toast } from '@/lib/styles/toast-styles';
import {
  CreateIndentItemRequest,
  UpdateIndentItemRequest,
} from '@/types/indents';

export const useCreateIndentItem = (indentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIndentItemRequest) =>
      indentItemsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: indentItemKeys.byIndent(indentId),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: indentItemKeys.byIndent(indentId),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: indentItemKeys.byIndent(indentId),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: indentItemKeys.byIndent(indentId),
      });
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(indentId) });
      toast.success('Item marked as converted to PO.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to convert item.'
      ),
  });
};
