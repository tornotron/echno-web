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

export interface CreateIndentItemInput {
  indentId?: number;
  materialId: number;
  requestedQuantity: number;
  orderedQuantity?: number;
  additionalSpecifications?: string;
  remarks?: string;
}

export function parseIndentItem(raw: Raw): IndentItem {
  return {
    id: raw.id,
    material: {
      id: raw.material?.id ?? raw.materialId ?? 0,
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
