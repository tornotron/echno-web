/**
 * hooks/site-transfers/use-site-transfers-mutations.ts
 *
 * React Query mutation hooks for site transfers.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { siteTransfersService } from '@/services/site-transfers-service';
import { siteTransferKeys } from './site-transfer-keys';
import { materialsKeys } from '@/hooks/materials/material-keys';
import { inventoryTransactionKeys } from '@/hooks/inventory-transactions/inventory-transaction-keys';
import { toast } from '@/lib/styles/toast-styles';
import { ApiError } from '@/lib/api/api-client';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreateSiteTransferRequest,
  SiteTransfer,
  SiteTransferStatus,
} from '@/types/site-transfers';

/**
 * Matches every SiteTransfer[] list cache under the 'site-transfers'
 * namespace — `lists()`, `paginated({...})`, `byStatus(s)`,
 * `bySendingProject(id)`, `byReceivingProject(id)`. Excludes `detail(id)`.
 */
function isSiteTransferListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) && key[0] === 'site-transfers' && key[1] !== 'detail'
  );
}

/**
 * Backend has no DELETE endpoint for site transfers per the live OpenAPI
 * spec (audited 2026-06-01). The hook fails fast with a clear message
 * rather than hitting the backend and producing a generic 404.
 *
 * Consumed by `app/users/dashboard/resources/transfers/[id]/page.tsx`.
 *
 * Resolution paths:
 *   1. Coordinate with the backend (deletion must reverse the stock
 *      decrement at source AND the stock increment at destination if the
 *      transfer is already RECEIVED — non-trivial server-side semantics).
 *   2. Switch the UI to a status transition (e.g. CANCELLED) once the state
 *      machine supports it.
 *   3. Remove the consumer.
 */
export const useDeleteSiteTransfer = () => {
  return useMutation({
    mutationFn: async (_id: number): Promise<void> => {
      throw new Error(
        'Delete is not supported by the backend (no DELETE /site-transfers/web/{id} endpoint). Deletion would require stock unwinding at source and destination; coordinate with the backend team.'
      );
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Delete Not Supported'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useCreateSiteTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteTransferRequest) =>
      siteTransfersService.create(dto),
    onSuccess: (newTransfer) => {
      // POST /site-transfers/web → SiteTransferDto (full).
      // Seed detail + append to main list. Scoped lists invalidated because
      // each has different semantics (sort/page for paginated; status of new
      // transfer for byStatus; project scope for sending/receiving).
      queryClient.setQueryData(
        siteTransferKeys.detail(newTransfer.id),
        newTransfer
      );
      queryClient.setQueryData<SiteTransfer[]>(
        siteTransferKeys.lists(),
        (old) => (old ? [...old, newTransfer] : [newTransfer])
      );
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'site-transfers' &&
          (q.queryKey[1] === 'paginated' ||
            q.queryKey[1] === 'status' ||
            q.queryKey[1] === 'sending-project' ||
            q.queryKey[1] === 'receiving-project'),
      });

      // Cross-namespace: creating a site transfer decrements stock at the
      // source storage location. Invalidate material stock for each item's
      // material; `MaterialWithStockDto` shape differs from `Material`, so
      // can't be patched from a SiteTransfer response.
      for (const item of newTransfer.items) {
        if (item.materialId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: materialsKeys.stock(item.materialId),
          });
        }
      }

      // Cross-namespace: a site transfer writes new inventory-transaction
      // rows for the source decrement. Invalidate the inventory-transactions
      // namespace so byMaterial / byStorageLocation / byProject scoped views
      // refresh.
      queryClient.invalidateQueries({
        queryKey: inventoryTransactionKeys.all,
      });

      toast.success('Transfer Created', {
        description:
          'Site transfer created successfully. Stock has been updated.',
      });
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      const isInsufficientStock =
        err instanceof ApiError &&
        err.status === 400 &&
        message.toLowerCase().includes('insufficient stock');
      if (isInsufficientStock) {
        toast.error('Insufficient Stock', { description: message });
      } else {
        toast.error(getErrorTitle(err, 'Failed to Create Transfer'), {
          description: message,
        });
      }
    },
  });
};

export const useUpdateSiteTransferStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: SiteTransferStatus }) =>
      siteTransfersService.updateStatus(id, status),
    onSuccess: (data, { id, status }) => {
      // PATCH /site-transfers/web/{id}/status → ApiResponse (ack) per spec.
      // Service `updateStatus` parses the response as SiteTransfer — same
      // drift pattern as useActivateLeavePolicy / useUpdatePOStatus.
      // Three-way fallback:
      //   1. If `data.id` is present, treat as the updated transfer + patch.
      //   2. Otherwise patch the status field on the cached detail.
      //   3. If neither has a usable shape, invalidate the detail.
      // FIXME: confirm backend response shape; align service signature
      // (Promise<void>) if spec is authoritative.
      const cachedDetail = queryClient.getQueryData<SiteTransfer>(
        siteTransferKeys.detail(id)
      );

      if (data && typeof data.id === 'number') {
        queryClient.setQueryData(siteTransferKeys.detail(id), data);
        queryClient.setQueriesData<SiteTransfer[]>(
          { predicate: isSiteTransferListCache },
          (old) => old?.map((t) => (t.id === id ? data : t))
        );
      } else if (cachedDetail) {
        const patched: SiteTransfer = { ...cachedDetail, status };
        queryClient.setQueryData(siteTransferKeys.detail(id), patched);
        queryClient.setQueriesData<SiteTransfer[]>(
          { predicate: isSiteTransferListCache },
          (old) => old?.map((t) => (t.id === id ? patched : t))
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: siteTransferKeys.detail(id),
        });
      }

      // Status changed — the transfer may have moved between byStatus(old)
      // and byStatus(new) buckets. predicate-replace updates wherever the
      // transfer is currently cached but doesn't insert into the new bucket;
      // invalidate all byStatus caches as the safety net.
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'site-transfers' &&
          q.queryKey[1] === 'status',
      });

      // Cross-namespace: a status transition to RECEIVED (or back) changes
      // destination stock. Without knowing the exact state machine, invalidate
      // stock for every item's material on any status change — both source
      // and destination are this material's stock view.
      const itemsForStock = cachedDetail?.items ?? [];
      for (const item of itemsForStock) {
        if (item.materialId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: materialsKeys.stock(item.materialId),
          });
        }
      }

      // Cross-namespace: a RECEIVED transition writes destination-increment
      // inventory-transaction rows. Other transitions may also affect the
      // log depending on the backend. Invalidate the entire namespace.
      queryClient.invalidateQueries({
        queryKey: inventoryTransactionKeys.all,
      });

      toast.success('Status Updated', {
        description: 'The transfer status has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Status'), {
        description: getErrorMessage(err),
      }),
  });
};
