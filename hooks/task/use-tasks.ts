import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task-service';
import { ApiError } from '@/lib/api/api-client';

/**
 * Determine if an error should trigger a retry.
 * We don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit).
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 3) return false;

  if (error instanceof ApiError) {
    if (error.isAuthError || error.isNotFound) return false;
    if (error.isServerError || error.isTimeout || error.status === 0)
      return true;
    if (error.status === 429) return true;
    if (error.status >= 400 && error.status < 500) return false;
  }

  return true;
}

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
