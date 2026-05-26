// TODO: Phase 17 — implement CreateIndentItemRequest (once backend documents create contract)
export interface CreateIndentItemRequest {
  indentId: number;
  materialId: number;
  quantity: number;
  unit: string;
  estimatedUnitCost?: number;
  requiredDate?: string; // ISO date string (YYYY-MM-DD) — convert Date at service boundary before api.post/api.put
}
