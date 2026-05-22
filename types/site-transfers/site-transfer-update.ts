// TODO: Phase 13 — implement UpdateSiteTransferRequest (once backend documents update contract)
export interface UpdateSiteTransferRequest {
  transferDate?: Date;
  fromLocationId?: number;
  toLocationId?: number;
  materialId?: number;
  quantity?: number;
  unit?: string;
  reason?: string;
  status?: string;
  expectedDeliveryDate?: Date;
}
