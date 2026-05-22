import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workCategoryService } from '@/services/work-category-service';
import { WorkCategory } from '@/types/work-category';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * useCreateWorkCategory
 *
 * React Query mutation hook that creates a work category and invalidates
 * the `['work-categories']` query on success.
 */
export function useCreateWorkCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WorkCategory>) =>
      workCategoryService.create(data),
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
    },
  });
}

/**
 * useDeleteWorkCategory
 *
 * Mutation hook that deletes a work category by id.
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
