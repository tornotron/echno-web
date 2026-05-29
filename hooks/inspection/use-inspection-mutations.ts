import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import type {
  CreateInspectionRequest,
  UpdateInspectionRequest,
} from '@/types/inspection';
import { inspectionKeys } from './inspection-keys';

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInspectionRequest) => inspectionService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
    },
  });
};

export const useUpdateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInspectionRequest }) =>
      inspectionService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(data.id),
      });
    },
  });
};
