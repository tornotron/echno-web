import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsService } from '@/services/materials-service';
import { materialsKeys } from './material-keys';
import {
  CreateMaterialRequest,
  UpdateMaterialRequest,
  Material,
} from '@/types/materials';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * Matches every Material[] list cache under the 'materials' namespace,
 * spanning `lists()`, `search(name)`, and `paginated(...)` — the service
 * flattens paginated responses to Material[] so all three share the same
 * data shape. Excludes `detail(id)` (Material) and `stock(id)` (MaterialStock).
 */
function isMaterialListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'materials' &&
    key[1] !== 'detail' &&
    key[1] !== 'stock'
  );
}

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMaterialRequest) => materialsService.create(dto),
    onSuccess: (newMaterial) => {
      // POST /materials/web → MaterialDto (full).
      // Seed detail + append to the main list. Search/paginated caches are
      // invalidated rather than appended: search is name-scoped and may or
      // may not match; paginated semantics depend on sort/page and aren't
      // safe to mutate without knowing them.
      queryClient.setQueryData(
        materialsKeys.detail(newMaterial.id),
        newMaterial
      );
      queryClient.setQueryData<Material[]>(materialsKeys.lists(), (old) =>
        old ? [...old, newMaterial] : [newMaterial]
      );
      // Invalidate scoped lists where direct append isn't safe.
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'materials' &&
          (q.queryKey[1] === 'search' || q.queryKey[1] === 'paginated'),
      });
      toast.success('Material Created', {
        description: 'The material has been created successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Create Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to create material:', error);
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMaterialRequest }) =>
      materialsService.update(id, data),
    onSuccess: (updatedMaterial, { id }) => {
      // PATCH /materials/web/{id} → MaterialDto (full).
      // Patch detail + every Material[] list cache (list, search, paginated)
      // in one pass. Invalidate stock view — material fields may affect its
      // display and the response is MaterialDto, not MaterialWithStockDto.
      queryClient.setQueryData(materialsKeys.detail(id), updatedMaterial);
      queryClient.setQueriesData<Material[]>(
        { predicate: isMaterialListCache },
        (old) => old?.map((m) => (m.id === id ? updatedMaterial : m))
      );
      queryClient.invalidateQueries({ queryKey: materialsKeys.stock(id) });
      toast.success('Material Updated', {
        description: 'The material has been updated successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Update Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to update material:', error);
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialsService.delete(id),
    onSuccess: (_data, id) => {
      // DELETE /materials/web/{id} → ApiResponse (ack).
      // Material gone — evict detail and stock caches; filter from every list.
      queryClient.removeQueries({ queryKey: materialsKeys.detail(id) });
      queryClient.removeQueries({ queryKey: materialsKeys.stock(id) });
      queryClient.setQueriesData<Material[]>(
        { predicate: isMaterialListCache },
        (old) => old?.filter((m) => m.id !== id)
      );
      toast.success('Material Deleted', {
        description: 'The material has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast.error(getErrorTitle(error, 'Failed to Delete Material'), {
        description: getErrorMessage(error),
      });
      logger.error('Failed to delete material:', error);
    },
  });
};
