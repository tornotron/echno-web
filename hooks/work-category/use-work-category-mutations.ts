import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workCategoryService } from '@/services/work-category-service';
import { CreateWorkCategoryRequest, WorkCategory } from '@/types/work-category';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';
import { workCategoryKeys } from './work-category-keys';

export function useCreateWorkCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWorkCategoryRequest) =>
      workCategoryService.create(dto),
    onSuccess: (newCategory) => {
      // POST /category/web → CategorySimpleDto (partial). WorkCategory is a
      // flat type (id, name, description?, icon?, image?), so the partial
      // response may omit optional scalar fields. Seed detail + append to
      // the list, then invalidate detail so the next observer pulls the
      // canonical CategoryDto.
      queryClient.setQueryData(
        workCategoryKeys.detail(newCategory.id),
        newCategory
      );
      queryClient.setQueryData<WorkCategory[]>(
        workCategoryKeys.lists(),
        (old) => (old ? [...old, newCategory] : [newCategory])
      );
      queryClient.invalidateQueries({
        queryKey: workCategoryKeys.detail(newCategory.id),
      });
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

export function useDeleteWorkCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workCategoryService.delete,
    onSuccess: (_data, id) => {
      // DELETE /category/web/{id} → ApiResponse (ack).
      // Evict detail + filter from list cache.
      queryClient.removeQueries({ queryKey: workCategoryKeys.detail(id) });
      queryClient.setQueryData<WorkCategory[]>(
        workCategoryKeys.lists(),
        (old) => old?.filter((c) => c.id !== id)
      );
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
