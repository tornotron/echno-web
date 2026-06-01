/**
 * hooks/indents/use-indents-mutations.ts
 *
 * React Query mutation hooks for indents (parent entity only — indent items
 * are handled by hooks/indent-items/).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { indentsService } from '@/services/indents-service';
import { indentsKeys } from './indent-keys';
import { indentItemKeys } from '@/hooks/indent-items/indent-item-keys';
import { poKeys } from '@/hooks/purchase-orders/purchase-order-keys';
import { toast } from '@/lib/styles/toast-styles';
import {
  CreateIndentRequest,
  UpdateIndentRequest,
  Indent,
} from '@/types/indents';

/**
 * Matches every Indent[] list cache under the 'indents' namespace —
 * `lists()` and `paginated({...})`. Service flattens paginated responses to
 * Indent[] so both share the same data shape. Excludes `detail(id)` and
 * the `items` sub-namespace (which belongs to the indent-items module).
 */
function isIndentListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key[0] === 'indents' &&
    key[1] !== 'detail' &&
    key[1] !== 'items'
  );
}

export const useCreateIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIndentRequest) => indentsService.create(dto),
    onSuccess: (newIndent) => {
      // POST /indents/web → IndentDto (full).
      // Seed detail + append to main list. Paginated invalidated separately
      // (sort/page semantics make direct append unsafe).
      queryClient.setQueryData(indentsKeys.detail(newIndent.id), newIndent);
      queryClient.setQueryData<Indent[]>(indentsKeys.lists(), (old) =>
        old ? [...old, newIndent] : [newIndent]
      );
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'indents' &&
          q.queryKey[1] === 'paginated',
      });
      toast.success('Indent created successfully.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to create indent.'
      ),
  });
};

export const useUpdateIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateIndentRequest }) =>
      indentsService.update(id, dto),
    onSuccess: (updatedIndent, { id }) => {
      // PATCH /indents/web/{id} → IndentDto (full).
      // Patch detail + every Indent[] list cache in one pass.
      queryClient.setQueryData(indentsKeys.detail(id), updatedIndent);
      queryClient.setQueriesData<Indent[]>(
        { predicate: isIndentListCache },
        (old) => old?.map((i) => (i.id === id ? updatedIndent : i))
      );
      // Cross-namespace: PO entries carry denormalized `indentNumber` /
      // `indentId` references. Invalidate the indent-scoped PO list so the
      // refreshed indent details propagate.
      queryClient.invalidateQueries({ queryKey: poKeys.byIndent(id) });
      toast.success('Indent updated successfully.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to update indent.'
      ),
  });
};

export const useDeleteIndent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => indentsService.delete(id),
    onSuccess: (_data, id) => {
      // DELETE /indents/web/{id} → ApiResponse (ack).
      // Indent gone — evict detail + filter from every list. Also evict the
      // indent-scoped items list owned by the indent-items module so a
      // deleted parent doesn't leave its items cached.
      queryClient.removeQueries({ queryKey: indentsKeys.detail(id) });
      queryClient.removeQueries({ queryKey: indentItemKeys.byIndent(id) });
      queryClient.setQueriesData<Indent[]>(
        { predicate: isIndentListCache },
        (old) => old?.filter((i) => i.id !== id)
      );
      // Cross-namespace: PO byIndent(id) cache may still hold references.
      // POs aren't deleted with their source indent (deletion semantics
      // unclear from spec) — invalidate so a stale link is surfaced if any.
      queryClient.invalidateQueries({ queryKey: poKeys.byIndent(id) });
      toast.success('Indent deleted.');
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete indent.'
      ),
  });
};
