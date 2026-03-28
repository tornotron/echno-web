/**
 * services/purchase-order-items-service.ts
 *
 * Typed client for purchase order item endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  PurchaseOrderItem,
  CreatePurchaseOrderItemInput,
  parsePurchaseOrderItem,
} from '@/types/purchase-orders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParsePurchaseOrderItem(data: Raw): PurchaseOrderItem {
  try {
    return parsePurchaseOrderItem(data);
  } catch (error) {
    logger.error('Failed to parse purchase order item:', error);
    throw new ApiError('Failed to process purchase order item data.', 422);
  }
}

export const purchaseOrderItemsService = {
  async getById(id: number): Promise<PurchaseOrderItem> {
    const data = await api.get<Raw>(`/purchase-order-items/${id}`);
    return safeParsePurchaseOrderItem(data);
  },

  async getByPurchaseOrder(
    purchaseOrderId: number
  ): Promise<PurchaseOrderItem[]> {
    const data = await api.get<Raw[]>(
      `/purchase-order-items/purchase-order/${purchaseOrderId}`
    );
    if (!Array.isArray(data)) return [];
    return data.map((item) => safeParsePurchaseOrderItem(item));
  },

  async getByMaterial(materialId: number): Promise<PurchaseOrderItem[]> {
    const data = await api.get<Raw[]>(
      `/purchase-order-items/material/${materialId}`
    );
    if (!Array.isArray(data)) return [];
    return data.map((item) => safeParsePurchaseOrderItem(item));
  },

  async create(item: CreatePurchaseOrderItemInput): Promise<PurchaseOrderItem> {
    const data = await api.post<Raw>('/purchase-order-items', item);
    return safeParsePurchaseOrderItem(data);
  },

  async update(
    id: number,
    item: CreatePurchaseOrderItemInput
  ): Promise<PurchaseOrderItem> {
    const data = await api.patch<Raw>(`/purchase-order-items/${id}`, item);
    return safeParsePurchaseOrderItem(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/purchase-order-items/${id}`);
  },
};
