import { parsePositiveInt } from '@/types/parse-id';

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

export interface CreateSiteTransferItemRequest {
  materialId: number;
  sentQuantity: number;
  remarks?: string;
}

export function createSiteTransferItemToJson(
  dto: CreateSiteTransferItemRequest
): Record<string, unknown> {
  return {
    materialId: dto.materialId,
    sentQuantity: dto.sentQuantity,
    remarks: dto.remarks,
  };
}

export function parseSiteTransferItem(raw: Raw): SiteTransferItem {
  const id = parsePositiveInt(raw.id, 'parseSiteTransferItem.id');
  return {
    id,
    materialId: raw.materialId ?? 0,
    materialName: raw.materialName ?? '',
    sentQuantity: raw.sentQuantity ?? 0,
    transferValue: raw.transferValue ?? undefined,
    remarks: raw.remarks ?? undefined,
  };
}
