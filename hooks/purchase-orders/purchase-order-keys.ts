import { PurchaseOrderStatus } from '@/types/purchase-orders';

export const poKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...poKeys.all, 'list'] as const,
  detail: (id: number) => [...poKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...poKeys.all, 'paginated', { pageNo, pageSize }] as const,
  byVendor: (vendorId: number) => [...poKeys.all, 'vendor', vendorId] as const,
  byIndent: (indentId: number) => [...poKeys.all, 'indent', indentId] as const,
  byStatus: (status: PurchaseOrderStatus) =>
    [...poKeys.all, 'status', status] as const,
};
