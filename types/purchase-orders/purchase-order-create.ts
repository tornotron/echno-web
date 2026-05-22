// TODO: Phase 15 — implement createPurchaseOrderToJson
// Backend contract: POST /api/v1/purchase-orders/web, docs/backend-api-docs.md §11
export interface PurchaseOrderItemInput {
  materialId: number;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface CreatePurchaseOrderRequest {
  poNumber: string;
  vendorId: number;
  poDate: Date;
  requiredDate: Date;
  deliveryAddress: string;
  totalAmount?: number;
  taxAmount?: number;
  notes?: string;
  paymentTerms?: string;
  items?: PurchaseOrderItemInput[];
}
