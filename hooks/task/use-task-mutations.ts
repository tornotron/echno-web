import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task-service';
import { Task } from '@/types/task';
import { CreateTaskRequest, TaskFiles } from '@/types/task/task-create';
import { UpdateTaskRequest } from '@/types/task/task-update';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { taskKeys } from './task-keys';

/**
 * Matches every Task[] list cache under the 'tasks' namespace while excluding
 * detail entries (Task), which have a numeric second segment.
 */
function isTaskListCache(query: { queryKey: ReadonlyArray<unknown> }): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'tasks' &&
    key.length > 1 &&
    typeof key[1] !== 'number'
  );
}

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
    onSuccess: (newTask, { data }) => {
      // Append to main list.
      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old) =>
        old ? [...old, newTask] : [newTask]
      );
      // Seed the detail cache so navigating to the new task page is instant.
      queryClient.setQueryData<Task>(taskKeys.detail(newTask.id), newTask);
      // Append to the project-scoped list only if that cache already exists.
      // Functional updater returns undefined for absent entries, avoiding a
      // spurious cache entry for projects the user hasn't visited.
      queryClient.setQueryData<Task[]>(
        taskKeys.byProject(data.projectId),
        (old) => (old ? [...old, newTask] : undefined)
      );
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ predicate: isTaskListCache });

      const previousDetail = queryClient.getQueryData<Task>(
        taskKeys.detail(id)
      );
      const previousListEntries = queryClient.getQueriesData<Task[]>({
        predicate: isTaskListCache,
      });

      // Build an optimistic snapshot from the detail cache, falling back to any
      // list entry. Fields that require joins (creatorId → Employee,
      // categoryId → WorkCategory, assigneeIds → Employee[]) are excluded;
      // onSuccess reconciles with the authoritative server response.
      const base =
        previousDetail ??
        previousListEntries
          .flatMap(([, items]) => items ?? [])
          .find((t) => t.id === id);

      if (base) {
        const optimisticTask: Task = {
          ...base,
          ...(data.title !== undefined && { title: data.title }),
          ...(data.projectId !== undefined && { projectId: data.projectId }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.progress !== undefined && { progress: data.progress }),
          ...(data.tags !== undefined && { tags: data.tags }),
        };
        queryClient.setQueryData<Task>(taskKeys.detail(id), optimisticTask);
        queryClient.setQueriesData<Task[]>(
          { predicate: isTaskListCache },
          (old) => old?.map((t) => (t.id === id ? optimisticTask : t))
        );
      }

      return { previousDetail, previousListEntries };
    },
    onError: (error, { id }, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData<Task>(
          taskKeys.detail(id),
          context.previousDetail
        );
      }
      for (const [key, value] of context?.previousListEntries ?? []) {
        queryClient.setQueryData<Task[]>(key, value);
      }
      const title = getErrorTitle(error, 'Failed to Update Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to update task:', error);
    },
    onSuccess: (updatedTask, { id }) => {
      // Reconcile with the authoritative server response.
      queryClient.setQueryData<Task>(taskKeys.detail(id), updatedTask);
      queryClient.setQueriesData<Task[]>(
        { predicate: isTaskListCache },
        (old) => old?.map((t) => (t.id === id ? updatedTask : t))
      );
      toast.success('Task Updated', {
        description: 'The task has been updated successfully',
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({ predicate: isTaskListCache });

      const previousDetail = queryClient.getQueryData<Task>(
        taskKeys.detail(id)
      );
      const previousListEntries = queryClient.getQueriesData<Task[]>({
        predicate: isTaskListCache,
      });

      // Apply deletion immediately — removed from all list caches and detail evicted.
      queryClient.setQueriesData<Task[]>(
        { predicate: isTaskListCache },
        (old) => old?.filter((t) => t.id !== id)
      );
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });

      return { previousDetail, previousListEntries };
    },
    onError: (error, id, context) => {
      // Restore list caches from snapshot.
      for (const [key, value] of context?.previousListEntries ?? []) {
        queryClient.setQueryData<Task[]>(key, value);
      }
      // Re-seed detail if it was present before the optimistic deletion.
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData<Task>(
          taskKeys.detail(id),
          context.previousDetail
        );
      }
      const title = getErrorTitle(error, 'Failed to Delete Task');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete task:', error);
    },
    onSuccess: () => {
      // Cache was already updated optimistically in onMutate; just confirm to the user.
      toast.success('Task Deleted', {
        description: 'The task has been deleted successfully',
      });
    },
  });
}
