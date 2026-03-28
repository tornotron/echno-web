/**
 * hooks/purchase-orders/use-purchase-orders-mutations.ts
 *
 * React Query mutation hooks for purchase orders.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersService } from '@/services/purchase-orders-service';
import { poKeys } from './purchase-order-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderStatus,
} from '@/types/purchase-orders';

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderInput) =>
      purchaseOrdersService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poKeys.lists() });
      toast.success('Purchase Order Created', {
        description: 'The purchase order has been created successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Create Purchase Order'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePurchaseOrderInput) =>
      purchaseOrdersService.update(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: poKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: poKeys.lists() });
      toast.success('Purchase Order Updated', {
        description: 'The purchase order has been updated successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Purchase Order'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => purchaseOrdersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poKeys.lists() });
      toast.success('Purchase Order Deleted', {
        description: 'The purchase order has been deleted.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Delete Purchase Order'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PurchaseOrderStatus }) =>
      purchaseOrdersService.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: poKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: poKeys.lists() });
      toast.success('Status Updated', {
        description: 'The purchase order status has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Status'), {
        description: getErrorMessage(err),
      }),
  });
};
