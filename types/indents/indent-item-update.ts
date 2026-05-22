// TODO: Phase 17 — implement updateIndentItemToJson
// Backend contract: PUT /api/v1/indent-items/web/{id}, docs/backend-api-docs.md §3
// Note: materialId, quantity, unit are required by the backend update contract
export interface UpdateIndentItemRequest {
  materialId: number;
  quantity: number;
  unit: string;
  estimatedUnitCost?: number;
  requiredDate?: Date;
  purpose?: string;
  notes?: string;
  priority?: string;
}
