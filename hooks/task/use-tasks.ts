import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task-service';
import { shouldRetry } from '@/lib/utils/retry';

/**
 * Hook to fetch all tasks.
 */
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single task by ID.
 */
export function useTask(id?: number) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Task ID is required');
      }
      return taskService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch tasks by project ID.
 * Fetches all tasks and filters client-side (no dedicated backend endpoint).
 */
export function useTasksByProject(projectId?: number) {
  return useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: async () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      const allTasks = await taskService.getAll();
      return allTasks.filter((task) => task.projectId === projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
