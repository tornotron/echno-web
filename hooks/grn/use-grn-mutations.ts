/**
 * hooks/grn/use-grn-mutations.ts
 *
 * React Query mutation hooks for Goods Received Notes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { grnService } from '@/services/grn-service';
import { grnKeys } from './grn-keys';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { poKeys } from '@/hooks/purchase-orders/purchase-order-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import { CreateGrnRequest } from '@/types/grn';

export const useDeleteGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => grnService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grnKeys.lists() });
      toast.success('GRN Deleted', {
        description: 'Goods received note deleted successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Delete GRN'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCreateGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGrnRequest) => grnService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: grnKeys.lists() });
      // GRN creation increases stock — invalidate material stock queries
      for (const item of data.items) {
        queryClient.invalidateQueries({
          queryKey: materialsKeys.stock(item.materialId),
        });
      }
      // Invalidate PO list so updated receivedQuantity is reflected
      if (data.purchaseOrderId) {
        queryClient.invalidateQueries({
          queryKey: poKeys.detail(data.purchaseOrderId),
        });
      }
      toast.success('GRN Recorded', {
        description:
          'Goods received note recorded successfully. Stock has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Record GRN'), {
        description: getErrorMessage(err),
      }),
  });
};
