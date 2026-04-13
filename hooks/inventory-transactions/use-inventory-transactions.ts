/**
 * hooks/inventory-transactions/use-inventory-transactions.ts
 *
 * React Query hooks for fetching inventory transactions (read-only).
 */

import { useQuery } from '@tanstack/react-query';
import { inventoryTransactionsService } from '@/services/inventory-transactions-service';
import { InventoryTransactionType } from '@/types/inventory-transactions';
import { inventoryTransactionKeys } from './inventory-transaction-keys';

export const useInventoryTransactions = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: inventoryTransactionKeys.paginated(pageNo, pageSize),
    queryFn: () =>
      inventoryTransactionsService.getAllPaginated(pageNo, pageSize),
  });

export const useInventoryTransaction = (id: number) =>
  useQuery({
    queryKey: inventoryTransactionKeys.detail(id),
    queryFn: () => inventoryTransactionsService.getById(id),
    enabled: !!id,
  });

export const useInventoryTransactionsByMaterial = (materialId: number) =>
  useQuery({
    queryKey: inventoryTransactionKeys.byMaterial(materialId),
    queryFn: () => inventoryTransactionsService.getByMaterial(materialId),
    enabled: !!materialId,
  });

export const useInventoryTransactionsByType = (
  type: InventoryTransactionType
) =>
  useQuery({
    queryKey: inventoryTransactionKeys.byType(type),
    queryFn: () => inventoryTransactionsService.getByType(type),
    enabled: !!type,
  });

export const useInventoryTransactionsByDateRange = (
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: inventoryTransactionKeys.byDateRange(startDate, endDate),
    queryFn: () =>
      inventoryTransactionsService.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

export const useMaterialStock = (materialId: number) =>
  useQuery({
    queryKey: inventoryTransactionKeys.materialStock(materialId),
    queryFn: () => inventoryTransactionsService.getMaterialStock(materialId),
    enabled: !!materialId,
  });

export const useStorageLocationStock = (storageLocationId: number) =>
  useQuery({
    queryKey: inventoryTransactionKeys.storageLocationStock(storageLocationId),
    queryFn: () =>
      inventoryTransactionsService.getStorageLocationStock(storageLocationId),
    enabled: !!storageLocationId,
  });

export const useInventoryTransactionsByStorageLocation = (
  storageLocationId: number
) =>
  useQuery({
    queryKey: inventoryTransactionKeys.byStorageLocation(storageLocationId),
    queryFn: () =>
      inventoryTransactionsService.getByStorageLocation(storageLocationId),
    enabled: !!storageLocationId,
  });

export const useInventoryTransactionsByStorageLocationAndMaterial = (
  storageLocationId: number,
  materialId: number,
  projectId: number
) =>
  useQuery({
    queryKey: inventoryTransactionKeys.byStorageLocationAndMaterial(
      storageLocationId,
      materialId,
      projectId
    ),
    queryFn: () =>
      inventoryTransactionsService.getByStorageLocationAndMaterial(
        storageLocationId,
        materialId,
        projectId
      ),
    enabled: !!storageLocationId && !!materialId && !!projectId,
  });

export { inventoryTransactionKeys } from './inventory-transaction-keys';
