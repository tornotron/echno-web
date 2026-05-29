import { parsePositiveInt } from '@/types/parse-id';
import type { Material } from '@/types/materials';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface IndentItem {
  id: number;
  material: Material;
  additionalSpecifications?: string;
  requestedQuantity: number;
  orderedQuantity?: number;
  remarks?: string;
  convertedToPurchaseOrder: boolean;
  linkedPurchaseOrderNumber?: string;
}

export function parseIndentItem(raw: Raw): IndentItem {
  return {
    id: parsePositiveInt(raw.id, 'parseIndentItem.id'),
    material: {
      id: parsePositiveInt(
        raw.material?.id ?? raw.materialId,
        'parseIndentItem.material.id'
      ),
      sku: raw.material?.sku ?? undefined,
      materialName: raw.material?.materialName ?? raw.materialName ?? '',
      unit: raw.material?.unit ?? raw.unit ?? '',
    },
    additionalSpecifications: raw.additionalSpecifications ?? undefined,
    requestedQuantity: raw.requestedQuantity,
    orderedQuantity: raw.orderedQuantity ?? undefined,
    remarks: raw.remarks ?? undefined,
    convertedToPurchaseOrder: raw.convertedToPurchaseOrder ?? false,
    linkedPurchaseOrderNumber: raw.linkedPurchaseOrderNumber ?? undefined,
  };
}
