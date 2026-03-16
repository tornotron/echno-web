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
import { CreateStorageLocationInput } from '@/types/storage-locations';

export const useUpdateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: CreateStorageLocationInput;
    }) => storageLocationsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageLocationKeys.lists() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageLocationKeys.lists() });
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

export const useCreateStorageLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStorageLocationInput) =>
      storageLocationsService.create(input),
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
