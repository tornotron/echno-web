// TODO: Phase 15 — implement updatePurchaseOrderToJson
// Backend contract: PATCH /api/v1/purchase-orders/web, docs/backend-api-docs.md §11
// ⚠️ id is required in body per backend contract — deviates from standard update(id, dto) pattern
export interface UpdatePurchaseOrderRequest {
  id: number;
  status: string;
  notes?: string;
  receivedDate?: Date;
}
