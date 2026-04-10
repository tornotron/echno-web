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
    id: raw.id ?? 0,
    materialId: raw.materialId ?? 0,
    materialName: raw.materialName ?? '',
    sentQuantity: raw.sentQuantity ?? 0,
    transferValue: raw.transferValue ?? undefined,
    remarks: raw.remarks ?? undefined,
  };
}
