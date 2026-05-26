/**
 * hooks/storage-locations/use-storage-locations-mutations.ts
 *
 * React Query mutation hooks for storage locations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storageLocationsService } from '@/services/storage-locations-service';
import { storageLocationKeys } from './storage-location-keys';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import {
  CreateStorageLocationRequest,
  UpdateStorageLocationRequest,
} from '@/types/storage-locations';

export const useCreateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStorageLocationRequest) =>
      storageLocationsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageLocationKeys.lists() });
      toast.success('Location Created', {
        description: 'The storage location has been created successfully',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Create Storage Location'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to create storage location:', error);
    },
  });
};

export const useUpdateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateStorageLocationRequest;
    }) => storageLocationsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: storageLocationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: storageLocationKeys.detail(id),
      });
      toast.success('Location Updated', {
        description: 'The storage location has been updated successfully',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Storage Location'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update storage location:', error);
    },
  });
};

export const useDeleteStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => storageLocationsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storageLocationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: storageLocationKeys.detail(id),
      });
      toast.success('Location Deleted', {
        description: 'The storage location has been deleted successfully',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Storage Location'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete storage location:', error);
    },
  });
};
