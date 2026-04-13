import { InventoryTransactionType } from '@/types/inventory-transactions';

export const inventoryTransactionKeys = {
  all: ['inventory-transactions'] as const,
  lists: () => [...inventoryTransactionKeys.all, 'list'] as const,
  detail: (id: number) =>
    [...inventoryTransactionKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [
      ...inventoryTransactionKeys.all,
      'paginated',
      { pageNo, pageSize },
    ] as const,
  byMaterial: (materialId: number) =>
    [...inventoryTransactionKeys.all, 'material', materialId] as const,
  materialStock: (materialId: number) =>
    [...inventoryTransactionKeys.all, 'material', materialId, 'stock'] as const,
  byStorageLocation: (storageLocationId: number) =>
    [
      ...inventoryTransactionKeys.all,
      'storage-location',
      storageLocationId,
    ] as const,
  storageLocationStock: (storageLocationId: number) =>
    [
      ...inventoryTransactionKeys.all,
      'storage-location',
      storageLocationId,
      'stock',
    ] as const,
  byStorageLocationAndMaterial: (
    storageLocationId: number,
    materialId: number,
    projectId: number
  ) =>
    [
      ...inventoryTransactionKeys.all,
      'storage-location',
      storageLocationId,
      'material',
      materialId,
      'project',
      projectId,
    ] as const,
  byType: (type: InventoryTransactionType) =>
    [...inventoryTransactionKeys.all, 'type', type] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [
      ...inventoryTransactionKeys.all,
      'date-range',
      startDate,
      endDate,
    ] as const,
};
