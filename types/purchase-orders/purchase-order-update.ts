import { PurchaseOrderStatus } from './enums';

// ⚠️ id is required in body — deviates from standard update(id, dto) pattern
export interface UpdatePurchaseOrderRequest {
  id: number;
  status?: PurchaseOrderStatus;
  projectId?: number;
  expectedDeliveryDate?: string;
  remarks?: string;
  totalAmount?: number;
}

export function updatePurchaseOrderToJson(
  dto: UpdatePurchaseOrderRequest
): Record<string, unknown> {
  return {
    id: dto.id,
    status: dto.status,
    projectId: dto.projectId,
    expectedDeliveryDate: dto.expectedDeliveryDate,
    remarks: dto.remarks,
    totalAmount: dto.totalAmount,
  };
}
