import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, TaskFiles } from '@/services/task-service';
import { Task } from '@/types/task/task';
import { toast } from '@/lib/styles/toast-styles';
import { ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';

/**
 * Get a user-friendly error message from an error.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get appropriate toast title based on error type.
 */
function getErrorTitle(error: unknown, defaultTitle: string): string {
  if (error instanceof ApiError) {
    if (error.isAuthError) return 'Authentication Required';
    if (error.isTimeout) return 'Request Timeout';
    if (error.isServerError) return 'Server Error';
    if (error.status === 0) return 'Network Error';
  }
  return defaultTitle;
}

/**
 * useCreateTask
 *
 * React Query mutation hook that creates a task and invalidates
 * the `['tasks']` query on success.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: Partial<Task>) => taskService.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

/**
 * useUpdateTask
 *
 * Mutation hook to update an existing task.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      taskService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
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

/**
 * useUpdateTaskWithFiles
 *
 * Mutation hook to update an existing task with file attachments.
 */
export function useUpdateTaskWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: number;
      data: Partial<Task>;
      files: TaskFiles;
    }) => taskService.updateWithFiles(id, data, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Task Updated', {
        description: 'The task has been updated successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Update Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update task with files:', error);
    },
  });
}

/**
 * useDeleteTask
 *
 * Mutation hook that deletes a task by id and invalidates the
 * `['tasks']` cache entry on success.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
