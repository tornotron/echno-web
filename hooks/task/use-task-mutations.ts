import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task-service';
import { CreateTaskRequest, TaskFiles } from '@/types/task/task-create';
import { UpdateTaskRequest } from '@/types/task/task-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { taskKeys } from './task-keys';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: CreateTaskRequest;
      files?: TaskFiles;
    }) => taskService.create(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task Created', {
        description: 'The task has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create task:', error);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: UpdateTaskRequest;
      files?: TaskFiles;
    }) => taskService.update(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      toast.success('Task Updated', {
        description: 'The task has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update task:', error);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      toast.success('Task Deleted', {
        description: 'The task has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete task:', error);
    },
  });
}
