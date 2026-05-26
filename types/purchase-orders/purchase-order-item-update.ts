export interface UpdatePurchaseOrderItemRequest {
  purchaseOrderId?: number;
  materialId?: number;
  orderedQuantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  remarks?: string;
}

export function updatePurchaseOrderItemToJson(
  dto: UpdatePurchaseOrderItemRequest
): Record<string, unknown> {
  return {
    purchaseOrderId: dto.purchaseOrderId,
    materialId: dto.materialId,
    orderedQuantity: dto.orderedQuantity,
    unitPrice: dto.unitPrice,
    totalPrice: dto.totalPrice,
    remarks: dto.remarks,
  };
}
