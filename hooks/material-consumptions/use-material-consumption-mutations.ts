import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialConsumptionsService } from '@/services/material-consumptions-service';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { materialConsumptionsKeys } from './material-consumption-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { CreateMaterialConsumptionRequest } from '@/types/materials';

export const useCreateConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMaterialConsumptionRequest) =>
      materialConsumptionsService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: materialConsumptionsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: materialsKeys.stock(data.materialId),
      });
      toast.success('Consumption Recorded', {
        description: 'Material consumption has been recorded successfully.',
      });
    },
    onError: (error) =>
      toast.error(getErrorTitle(error, 'Failed to Record Consumption'), {
        description: getErrorMessage(error),
      }),
  });
};
