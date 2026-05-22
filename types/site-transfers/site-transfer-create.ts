// TODO: Phase 13 — implement createSiteTransferToJson
// Backend contract: POST /api/v1/site-transfers/web, docs/backend-api-docs.md §9
export interface CreateSiteTransferRequest {
  transferDate: Date;
  fromLocationId: number;
  toLocationId: number;
  materialId: number;
  quantity: number;
  unit: string;
  reason: string;
  status?: string;
  expectedDeliveryDate?: Date;
}
