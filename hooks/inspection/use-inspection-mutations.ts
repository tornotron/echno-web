import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionService } from '@/services/inspection-service';
import type {
  CreateInspectionRequest,
  UpdateInspectionRequest,
} from '@tornotron/echno-core/inspection/types';
import { inspectionKeys } from './inspection-keys';

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInspectionRequest) => inspectionService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
    },
  });
};

export const useUpdateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateInspectionRequest }) =>
      inspectionService.update(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: inspectionKeys.detail(data.id),
      });
    },
  });
};
