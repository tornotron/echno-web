/**
 * services/purchase-orders-service.ts
 *
 * Typed client for purchase orders backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  parsePurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  createPurchaseOrderToJson,
  updatePurchaseOrderToJson,
} from '@/types/purchase-orders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParsePurchaseOrder(data: Raw): PurchaseOrder {
  try {
    return parsePurchaseOrder(data);
  } catch (error) {
    logger.error('Failed to parse purchase order:', error);
    throw new ApiError('Failed to process purchase order data.', 422);
  }
}

function safeParsePurchaseOrders(data: Raw[]): PurchaseOrder[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parsePurchaseOrder(item));
  } catch (error) {
    logger.error('Failed to parse purchase orders:', error);
    throw new ApiError('Failed to process purchase orders data.', 422);
  }
}

export const purchaseOrdersService = {
  async create(dto: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const data = await api.post<Raw>(
      '/purchase-orders/web',
      createPurchaseOrderToJson(dto)
    );
    return safeParsePurchaseOrder(data);
  },

  async getAll(): Promise<PurchaseOrder[]> {
    const data = await api.get<Raw[]>('/purchase-orders/web');
    return safeParsePurchaseOrders(data);
  },

  async getAllPaginated(pageNo = 0, pageSize = 10): Promise<PurchaseOrder[]> {
    const data = await api.get<Raw[]>('/purchase-orders/web/all', {
      pageNo,
      pageSize,
    });
    return safeParsePurchaseOrders(data);
  },

  async getById(id: number): Promise<PurchaseOrder> {
    const data = await api.get<Raw>(`/purchase-orders/web/${id}`);
    return safeParsePurchaseOrder(data);
  },

  async getByVendor(vendorId: number): Promise<PurchaseOrder[]> {
    const data = await api.get<Raw[]>(
      `/purchase-orders/web/vendor/${vendorId}`
    );
    return safeParsePurchaseOrders(data);
  },

  async getByIndent(indentId: number): Promise<PurchaseOrder[]> {
    const data = await api.get<Raw[]>(
      `/purchase-orders/web/indent/${indentId}`
    );
    return safeParsePurchaseOrders(data);
  },

  async getByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const data = await api.get<Raw[]>(`/purchase-orders/web/status/${status}`);
    return safeParsePurchaseOrders(data);
  },

  async update(dto: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const data = await api.patch<Raw>(
      `/purchase-orders/web/${dto.id}`,
      updatePurchaseOrderToJson(dto)
    );
    return safeParsePurchaseOrder(data);
  },

  async updateStatus(
    id: number,
    status: PurchaseOrderStatus
  ): Promise<PurchaseOrder> {
    const data = await api.patch<Raw>(
      `/purchase-orders/web/${id}/status`,
      {},
      { status }
    );
    return safeParsePurchaseOrder(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/purchase-orders/web/${id}`);
  },
};
