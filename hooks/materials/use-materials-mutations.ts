/**
 * hooks/materials/use-materials-mutations.ts
 *
 * React Query mutation hooks for materials and consumptions.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsService } from '@/services/materials-service';
import { materialsKeys } from './material-keys';
import {
  CreateMaterialInput,
  CreateMaterialConsumptionInput,
} from '@/types/materials';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (material: CreateMaterialInput) =>
      materialsService.create(material),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
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
    mutationFn: ({
      id,
      material,
    }: {
      id: number;
      material: CreateMaterialInput;
    }) => materialsService.update(id, material),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: materialsKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
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

export const useCreateConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consumption: CreateMaterialConsumptionInput) =>
      materialsService.createConsumption(consumption),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.consumptions() });
      queryClient.invalidateQueries({
        queryKey: materialsKeys.stock(data.materialId),
      });
      toast.success('Consumption Recorded', {
        description: 'Material consumption has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Record Consumption'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to create material consumption:', error);
    },
  });
};
