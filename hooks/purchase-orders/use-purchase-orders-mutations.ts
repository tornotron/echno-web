/**
 * hooks/purchase-orders/use-purchase-orders-mutations.ts
 *
 * React Query mutation hooks for purchase orders.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersService } from '@/services/purchase-orders-service';
import { poKeys } from './purchase-order-keys';
import { vendorKeys } from '@/hooks/vendors/vendor-keys';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@/lib/utils/error-helpers';
import {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '@/types/purchase-orders';

/**
 * Matches every PurchaseOrder[] list cache under the 'purchase-orders'
 * namespace — `lists()`, `paginated({...})`, `byVendor(id)`, `byIndent(id)`,
 * `byStatus(s)`. Excludes only `detail(id)`.
 */
function isPurchaseOrderListCache(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) && key[0] === 'purchase-orders' && key[1] !== 'detail'
  );
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderRequest) =>
      purchaseOrdersService.create(dto),
    onSuccess: (newPO) => {
      // POST /purchase-orders/web → PurchaseOrderDto (full).
      // Seed detail + append to main list. Scoped lists (byVendor, byIndent,
      // byStatus, paginated) are invalidated because direct append isn't
      // semantically safe (status-scoped lists depend on the new PO's status;
      // paginated views depend on sort/page; byVendor/byIndent require the
      // scope id to match).
      queryClient.setQueryData(poKeys.detail(newPO.id), newPO);
      queryClient.setQueryData<PurchaseOrder[]>(poKeys.lists(), (old) =>
        old ? [...old, newPO] : [newPO]
      );
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'purchase-orders' &&
          (q.queryKey[1] === 'paginated' ||
            q.queryKey[1] === 'vendor' ||
            q.queryKey[1] === 'indent' ||
            q.queryKey[1] === 'status'),
      });
      // Cross-namespace: vendor summary may roll up PO counts / outstanding
      // amounts. Invalidate the affected vendor's summary cache.
      if (newPO.vendorId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: vendorKeys.summary(newPO.vendorId),
        });
      }
      toast.success('Purchase Order Created', {
        description: 'The purchase order has been created successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Create Purchase Order'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePurchaseOrderRequest) =>
      purchaseOrdersService.update(dto),
    onSuccess: (updatedPO) => {
      // PATCH /purchase-orders/web → PurchaseOrderDto (full).
      // Note: PATCH carries the id in the body (no path param). Patch detail
      // + every PurchaseOrder[] list cache (lists, paginated, byVendor,
      // byIndent, byStatus) in one pass.
      queryClient.setQueryData(poKeys.detail(updatedPO.id), updatedPO);
      queryClient.setQueriesData<PurchaseOrder[]>(
        { predicate: isPurchaseOrderListCache },
        (old) => old?.map((p) => (p.id === updatedPO.id ? updatedPO : p))
      );
      // Cross-namespace: vendor summary may include PO totals / counts.
      if (updatedPO.vendorId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: vendorKeys.summary(updatedPO.vendorId),
        });
      }
      toast.success('Purchase Order Updated', {
        description: 'The purchase order has been updated successfully.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Purchase Order'), {
        description: getErrorMessage(err),
      }),
  });
};

/**
 * Backend has no DELETE endpoint for purchase orders per the live OpenAPI
 * spec (audited 2026-06-01). The hook fails fast with a clear message rather
 * than hitting the backend and producing a generic 404.
 *
 * This hook is consumed by
 * `app/users/dashboard/resources/purchase-orders/[id]/page.tsx`. The button's
 * error toast will now read "Delete is not supported by the backend" instead
 * of a 404.
 *
 * Resolution paths (any one closes the FIXME):
 *   1. Coordinate with the backend team to add the endpoint.
 *   2. Switch the UI to a status transition (CANCELLED) via `useUpdatePOStatus`
 *      and remove this hook.
 *   3. Remove the consumer if PO deletion is intentionally unavailable.
 */
export const useDeletePurchaseOrder = () => {
  return useMutation({
    mutationFn: async (_id: number): Promise<void> => {
      throw new Error(
        'Delete is not supported by the backend (no DELETE /purchase-orders/web/{id} endpoint). Use status transition CANCELLED via useUpdatePOStatus instead.'
      );
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Delete Not Supported'), {
        description: getErrorMessage(err),
      }),
  });
};

export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PurchaseOrderStatus }) =>
      purchaseOrdersService.updateStatus(id, status),
    onSuccess: (data, { id, status }) => {
      // PATCH /purchase-orders/web/{id}/status → ApiResponse (ack) per spec.
      // Service `updateStatus` parses the response as PurchaseOrder — same
      // drift pattern as useActivateLeavePolicy. Guard the patch:
      //   - If `data.id` is present, treat as the updated PO and patch.
      //   - Otherwise, patch the status field locally + invalidate the
      //     status-scoped list (entry should move between byStatus buckets).
      // FIXME: confirm backend response shape; align service signature
      // (Promise<void>) if spec is authoritative.
      const cachedDetail = queryClient.getQueryData<PurchaseOrder>(
        poKeys.detail(id)
      );

      if (data && typeof data.id === 'number') {
        queryClient.setQueryData(poKeys.detail(id), data);
        queryClient.setQueriesData<PurchaseOrder[]>(
          { predicate: isPurchaseOrderListCache },
          (old) => old?.map((p) => (p.id === id ? data : p))
        );
        if (data.vendorId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: vendorKeys.summary(data.vendorId),
          });
        }
      } else if (cachedDetail) {
        // Service drift fallback: patch the status field on the cached PO.
        const patched: PurchaseOrder = { ...cachedDetail, status };
        queryClient.setQueryData(poKeys.detail(id), patched);
        queryClient.setQueriesData<PurchaseOrder[]>(
          { predicate: isPurchaseOrderListCache },
          (old) => old?.map((p) => (p.id === id ? patched : p))
        );
        if (cachedDetail.vendorId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: vendorKeys.summary(cachedDetail.vendorId),
          });
        }
      } else {
        // No cached detail to patch from — invalidate scoped lists.
        queryClient.invalidateQueries({ queryKey: poKeys.detail(id) });
      }

      // The PO may have moved between byStatus(old) and byStatus(new) buckets.
      // setQueriesData replace works wherever it's currently cached, but the
      // OTHER status bucket (the new one) won't get the entry inserted by a
      // replace — invalidate all byStatus caches so they refetch the next time
      // they're observed.
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'purchase-orders' &&
          q.queryKey[1] === 'status',
      });

      toast.success('Status Updated', {
        description: 'The purchase order status has been updated.',
      });
    },
    onError: (err) =>
      toast.error(getErrorTitle(err, 'Failed to Update Status'), {
        description: getErrorMessage(err),
      }),
  });
};
