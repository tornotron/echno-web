import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface GrnItem {
  id: number;
  materialId: number;
  materialName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost?: number;
}

export function parseGrnItem(raw: Raw): GrnItem {
  return {
    id: parsePositiveInt(raw.id, 'parseGrnItem.id'),
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    orderedQuantity: raw.orderedQuantity,
    receivedQuantity: raw.receivedQuantity,
    unitCost: raw.unitCost ?? undefined,
  };
}
