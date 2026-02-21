import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workCategoryService } from '@/services/work-category-service';
import { WorkCategory } from '@/types/task/work-category';
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
 * useCreateWorkCategory
 *
 * React Query mutation hook that creates a work category and invalidates
 * the `['work-categories']` query on success.
 */
export function useCreateWorkCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: Partial<WorkCategory>) =>
      workCategoryService.create(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      toast.success('Category Created', {
        description: 'The work category has been created successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Create Category');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create work category:', error);
      if (error instanceof ApiError && error.errors) {
        logger.error('Validation errors:', error.errors);
      }
    },
  });
}

/**
 * useDeleteWorkCategory
 *
 * Mutation hook that deletes a work category by id and invalidates the
 * `['work-categories']` cache entry on success.
 */
export function useDeleteWorkCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workCategoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      toast.success('Category Deleted', {
        description: 'The work category has been deleted successfully',
      });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Delete Category');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to delete work category:', error);
    },
  });
}
