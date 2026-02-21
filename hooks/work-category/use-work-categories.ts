import { useQuery } from '@tanstack/react-query';
import { workCategoryService } from '@/services/work-category-service';
import { ApiError } from '@/lib/api/api-client';

/**
 * Determine if an error should trigger a retry.
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
 * Hook to fetch all work categories.
 */
export function useWorkCategories() {
  return useQuery({
    queryKey: ['work-categories'],
    queryFn: () => workCategoryService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

/**
 * Hook to fetch a single work category by ID.
 */
export function useWorkCategory(id?: number) {
  return useQuery({
    queryKey: ['work-categories', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Work category ID is required');
      }
      return workCategoryService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}
