// TODO: Phase 16 — implement createPurchaseOrderItemToJson
// Backend contract: POST /api/v1/purchase-order-items/web, docs/backend-api-docs.md §12
export interface CreatePurchaseOrderItemRequest {
  purchaseOrderId: number;
  materialId: number;
  quantity: number;
  unitPrice: number;
  total?: number;
  description?: string;
  specifications?: string;
}
