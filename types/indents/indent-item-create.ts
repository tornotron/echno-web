// TODO: Phase 17 — implement CreateIndentItemRequest (once backend documents create contract)
export interface CreateIndentItemRequest {
  indentId: number;
  materialId: number;
  quantity: number;
  unit: string;
  estimatedUnitCost?: number;
  requiredDate?: Date;
}
