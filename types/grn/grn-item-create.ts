export interface CreateGrnItemRequest {
  materialId: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost?: number;
}
