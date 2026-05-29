import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsService } from '@/services/materials-service';
import { materialsKeys } from './material-keys';
import {
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from '@/types/materials';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMaterialRequest) => materialsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.all });
      toast.success('Material Created', {
        description: 'The material has been created successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Create Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to create material:', error);
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaterialRequest }) =>
      materialsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.all });
      toast.success('Material Updated', {
        description: 'The material has been updated successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update material:', error);
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.all });
      toast.success('Material Deleted', {
        description: 'The material has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete material:', error);
    },
  });
};
