import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wbsElementService } from '@/services/wbs-element-service';
import { wbsElementKeys } from './wbs-element-keys';
import { toast } from '@/lib/styles/toast-styles';
import {
  CreateWbsElementRequest,
  BulkCreateWbsElementsRequest,
  UpdateWbsElementRequest,
  MoveWbsElementRequest,
} from '@/types/wbs-element';

export const useCreateWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWbsElementRequest) =>
      wbsElementService.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
      });
      toast.success('WBS element created.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create WBS element.'
      ),
  });
};

export const useBulkCreateWbsElements = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkCreateWbsElementsRequest) =>
      wbsElementService.bulkCreate(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
      });
      toast.success('WBS elements created.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create WBS elements.'
      ),
  });
};

export const useUpdateWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWbsElementRequest }) =>
      wbsElementService.update(projectId, id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.detail(projectId, updated.id),
      });
      toast.success('WBS element updated.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update WBS element.'
      ),
  });
};

export const useMoveWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MoveWbsElementRequest }) =>
      wbsElementService.move(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
      });
      toast.success('WBS element moved.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to move WBS element.'
      ),
  });
};

export const useDeleteWbsElement = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (elementId: number) =>
      wbsElementService.delete(projectId, elementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wbsElementKeys.byProject(projectId),
      });
      toast.success('WBS element deleted.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete WBS element.'
      ),
  });
};
