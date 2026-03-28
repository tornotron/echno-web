/**
 * hooks/purchase-orders/use-purchase-orders.ts
 *
 * React Query hooks for fetching purchase orders.
 */

import { useQuery } from '@tanstack/react-query';
import { purchaseOrdersService } from '@/services/purchase-orders-service';
import { PurchaseOrderStatus } from '@/types/purchase-orders';
import { poKeys } from './purchase-order-keys';

export const usePurchaseOrders = () =>
  useQuery({
    queryKey: poKeys.lists(),
    queryFn: () => purchaseOrdersService.getAll(),
  });

export const usePurchaseOrdersPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: poKeys.paginated(pageNo, pageSize),
    queryFn: () => purchaseOrdersService.getAllPaginated(pageNo, pageSize),
  });

export const usePurchaseOrder = (id: number) =>
  useQuery({
    queryKey: poKeys.detail(id),
    queryFn: () => purchaseOrdersService.getById(id),
    enabled: !!id,
  });

export const usePOsByVendor = (vendorId: number) =>
  useQuery({
    queryKey: poKeys.byVendor(vendorId),
    queryFn: () => purchaseOrdersService.getByVendor(vendorId),
    enabled: !!vendorId,
  });

export const usePOsByIndent = (indentId: number) =>
  useQuery({
    queryKey: poKeys.byIndent(indentId),
    queryFn: () => purchaseOrdersService.getByIndent(indentId),
    enabled: !!indentId,
  });

export const usePOsByStatus = (status: PurchaseOrderStatus) =>
  useQuery({
    queryKey: poKeys.byStatus(status),
    queryFn: () => purchaseOrdersService.getByStatus(status),
    enabled: !!status,
  });

export { poKeys } from './purchase-order-keys';
