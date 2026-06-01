/**
 * hooks/grn/use-grn-mutations.ts
 *
 * React Query mutation hooks for Goods Received Notes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { grnService } from '@/services/grn-service';
import { grnKeys } from './grn-keys';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { poKeys } from '@/hooks/purchase-orders/purchase-order-keys';
import { poItemKeys } from '@/hooks/purchase-order-items/purchase-order-item-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreateGrnRequest,
  UpdateGrnRequest,
  GoodsReceivedNote,
} from '@/types/grn';

/**
 * Matches every GoodsReceivedNote[] list cache under the 'grn' namespace —
 * `lists()`, `paginated({...})`, `byVendor(id)`, `byDateRange(start, end)`.
 * Excludes only `detail(id)`.
 */
function isGrnListCache(query: { queryKey: ReadonlyArray<unknown> }): boolean {
  const key = query.queryKey;
  return Array.isArray(key) && key[0] === 'grn' && key[1] !== 'detail';
}

/**
 * Backend has no DELETE endpoint for GRNs per the live OpenAPI spec
 * (audited 2026-06-01). The hook fails fast with a clear message rather than
 * hitting the backend.
 *
 * Consumed by
 * `app/users/dashboard/resources/goods-receipts/[id]/page.tsx`. The button's
 * error toast will now read "Delete is not supported" instead of 404.
 *
 * Resolution paths:
 *   1. Coordinate with the backend (deletion must reverse the stock
 *      increment — non-trivial server-side semantics).
 *   2. Add a status field to GRN and switch the UI to a VOIDED transition.
 *   3. Remove the consumer.
 */
export const useDeleteGRN = () => {
  return useMutation({
    mutationFn: async (_id: number): Promise<void> => {
      throw new Error(
        'Delete is not supported by the backend (no DELETE /grns/web/{id} endpoint). Deletion would require stock unwinding; coordinate with the backend team.'
      );
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Delete Not Supported'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCreateGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGrnRequest) => grnService.create(dto),
    onSuccess: (newGrn) => {
      // POST /grns/web → GoodsReceivedNoteDto (full).
      // Seed detail + append to main list. Scoped lists (paginated, byVendor,
      // byDateRange) are invalidated rather than appended — each has different
      // semantics (sort/page, vendor scope, date filter) that direct append
      // would not satisfy.
      queryClient.setQueryData(grnKeys.detail(newGrn.id), newGrn);
      queryClient.setQueryData<GoodsReceivedNote[]>(grnKeys.lists(), (old) =>
        old ? [...old, newGrn] : [newGrn]
      );
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'grn' &&
          (q.queryKey[1] === 'paginated' ||
            q.queryKey[1] === 'vendor' ||
            q.queryKey[1] === 'date-range'),
      });

      // Cross-namespace: GRN posting increases stock for each item's material.
      // Material stock view (`MaterialWithStockDto`) is a different shape than
      // Material; invalidate to refetch fresh stock levels.
      for (const item of newGrn.items) {
        if (item.materialId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: materialsKeys.stock(item.materialId),
          });
        }
      }

      // Cross-namespace: receiving against a PO increments each PO item's
      // `receivedQuantity` and may flip the PO status when fully received.
      // Invalidate the parent PO detail + its items list.
      if (newGrn.purchaseOrderId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: poKeys.detail(newGrn.purchaseOrderId),
        });
        queryClient.invalidateQueries({
          queryKey: poItemKeys.byPO(newGrn.purchaseOrderId),
        });
      }

      toast.success('GRN Recorded', {
        description:
          'Goods received note recorded successfully. Stock has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Record GRN'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdateGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateGrnRequest) => grnService.update(dto),
    onSuccess: (updatedGrn) => {
      // PATCH /grns/web → GoodsReceivedNoteDto (full). Id is carried in the
      // request body, same pattern as PO update.
      // Patch detail + every GRN[] list cache in one predicate pass.
      queryClient.setQueryData(grnKeys.detail(updatedGrn.id), updatedGrn);
      queryClient.setQueriesData<GoodsReceivedNote[]>(
        { predicate: isGrnListCache },
        (old) => old?.map((g) => (g.id === updatedGrn.id ? updatedGrn : g))
      );
      toast.success('GRN Updated', {
        description: 'The goods received note has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update GRN'), {
        description: getErrorMessage(err),
      }),
  });
};
