import { PurchaseOrderStatus } from './enums';
import type { InlinePurchaseOrderItemInput } from './purchase-order-item';

export interface CreatePurchaseOrderRequest {
  poNumber: string;
  vendorId: number;
  projectId: number;
  indentId?: number;
  status: PurchaseOrderStatus;
  createdBy: number;
  expectedDeliveryDate?: string;
  remarks?: string;
  totalAmount?: number;
  items: InlinePurchaseOrderItemInput[];
}

export function createPurchaseOrderToJson(
  dto: CreatePurchaseOrderRequest
): Record<string, unknown> {
  return {
    poNumber: dto.poNumber,
    vendorId: dto.vendorId,
    projectId: dto.projectId,
    indentId: dto.indentId,
    status: dto.status,
    createdBy: dto.createdBy,
    expectedDeliveryDate: dto.expectedDeliveryDate,
    remarks: dto.remarks,
    totalAmount: dto.totalAmount,
    items: dto.items,
  };
}
