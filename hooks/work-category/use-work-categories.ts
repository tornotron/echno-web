import { useQuery } from '@tanstack/react-query';
import { workCategoryService } from '@/services/work-category-service';
import { shouldRetry } from '@/lib/utils/retry';

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
