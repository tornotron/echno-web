import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, TaskFiles } from '@/services/task-service';
import { Task } from '@/types/task/task';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

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
 * useCreateTaskWithFiles
 *
 * Mutation hook to create a new task with file attachments.
 */
export function useCreateTaskWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, files }: { data: Partial<Task>; files: TaskFiles }) =>
      taskService.createWithFiles(data, files),
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
      logger.error('Failed to create task with files:', error);
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
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
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
