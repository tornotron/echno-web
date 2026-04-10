// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface SiteTransferItem {
  id: number;
  materialId: number;
  materialName: string;
  sentQuantity: number;
  transferValue?: number;
  remarks?: string;
}

export interface CreateSiteTransferItemInput {
  materialId: number;
  sentQuantity: number;
  remarks?: string;
}

export function parseSiteTransferItem(raw: Raw): SiteTransferItem {
  return {
    id: raw.id,
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    sentQuantity: raw.sentQuantity,
    transferValue: raw.transferValue ?? undefined,
    remarks: raw.remarks ?? undefined,
  };
}
