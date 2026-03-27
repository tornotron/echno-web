/**
 * services/inventory-transactions-service.ts
 *
 * Read-only client for Inventory Transactions backend endpoints.
 * Transactions are written automatically by backend events (GRN, Consumption, SiteTransfer).
 * No write endpoints exist — never try to create or modify transactions from the frontend.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  InventoryTransaction,
  InventoryTransactionType,
  MaterialStock,
  parseInventoryTransaction,
  parseMaterialStock,
} from '@/types/inventory-transactions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParse(data: Raw): InventoryTransaction {
  try {
    return parseInventoryTransaction(data);
  } catch (error) {
    logger.error('Failed to parse inventory transaction:', error);
    throw new ApiError('Failed to process inventory transaction data.', 422);
  }
}

function safeParseAll(data: Raw[]): InventoryTransaction[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseInventoryTransaction(item));
  } catch (error) {
    logger.error('Failed to parse inventory transactions:', error);
    throw new ApiError('Failed to process inventory transactions data.', 422);
  }
}

export const inventoryTransactionsService = {
  async getAll(): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>('/inventory-transactions/web');
    return safeParseAll(data);
  },

  async getAllPaginated(
    pageNo = 0,
    pageSize = 10
  ): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>('/inventory-transactions/web/all', {
      pageNo,
      pageSize,
    });
    return safeParseAll(data);
  },

  async getById(id: number): Promise<InventoryTransaction> {
    const data = await api.get<Raw>(`/inventory-transactions/web/${id}`);
    return safeParse(data);
  },

  async getByMaterial(materialId: number): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>(
      `/inventory-transactions/web/material/${materialId}`
    );
    return safeParseAll(data);
  },

  async getByType(
    type: InventoryTransactionType
  ): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>(
      `/inventory-transactions/web/type/${type}`
    );
    return safeParseAll(data);
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>(
      '/inventory-transactions/web/date-range',
      { startDate, endDate }
    );
    return safeParseAll(data);
  },

  async getMaterialStock(materialId: number): Promise<MaterialStock> {
    const data = await api.get<Raw>(
      `/inventory-transactions/web/material/${materialId}/stock`
    );
    return parseMaterialStock(data);
  },

  async getByStorageLocation(
    storageLocationId: number
  ): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>(
      `/inventory-transactions/web/storage-location/${storageLocationId}`
    );
    return safeParseAll(data);
  },

  async getByStorageLocationAndMaterial(
    storageLocationId: number,
    materialId: number,
    projectId: number
  ): Promise<InventoryTransaction[]> {
    const data = await api.get<Raw[]>(
      `/inventory-transactions/web/storage-location/${storageLocationId}/material/${materialId}/project/${projectId}`
    );
    return safeParseAll(data);
  },
};
