/**
 * hooks/indents/use-indents-mutations.ts
 *
 * React Query mutation hooks for indents.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { indentsService } from '@/services/indents-service';
import { indentsKeys } from './indent-keys';
import { toast } from '@/lib/styles/toast-styles';
import { CreateIndentRequest, UpdateIndentRequest } from '@/types/indents';

export const useCreateIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIndentRequest) => indentsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indentsKeys.all });
      toast.success('Indent created successfully.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create indent.'
      ),
  });
};

export const useUpdateIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateIndentRequest }) =>
      indentsService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: indentsKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: indentsKeys.lists() });
      toast.success('Indent updated successfully.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update indent.'
      ),
  });
};

export const useDeleteIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => indentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indentsKeys.all });
      toast.success('Indent deleted.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete indent.'
      ),
  });
};
