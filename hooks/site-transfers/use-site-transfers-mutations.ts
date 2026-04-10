/**
 * hooks/site-transfers/use-site-transfers-mutations.ts
 *
 * React Query mutation hooks for site transfers.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { siteTransfersService } from '@/services/site-transfers-service';
import { siteTransferKeys } from './site-transfer-keys';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { toast } from '@/lib/styles/toast-styles';
import { ApiError } from '@/lib/api/api-client';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreateSiteTransferInput,
  SiteTransferStatus,
} from '@/types/site-transfers';

export const useDeleteSiteTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => siteTransfersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteTransferKeys.lists() });
      toast.success('Transfer Deleted', {
        description: 'Site transfer deleted successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Delete Transfer'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCreateSiteTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteTransferInput) =>
      siteTransfersService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: siteTransferKeys.lists() });
      // Site transfer immediately decrements stock — invalidate all material stocks
      for (const item of data.items) {
        queryClient.invalidateQueries({
          queryKey: materialsKeys.stock(item.materialId),
        });
      }
      toast.success('Transfer Created', {
        description:
          'Site transfer created successfully. Stock has been updated.',
      });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 400) {
        toast.error('Insufficient Stock', {
          description: getErrorMessage(err),
        });
      } else {
        toast.error(getErrorTitle(err, 'Failed to Create Transfer'), {
          description: getErrorMessage(err),
        });
      }
    },
  });
};

export const useUpdateSiteTransferStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: SiteTransferStatus }) =>
      siteTransfersService.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: siteTransferKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: siteTransferKeys.lists() });
      toast.success('Status Updated', {
        description: 'The transfer status has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Status'), {
        description: getErrorMessage(err),
      }),
  });
};
