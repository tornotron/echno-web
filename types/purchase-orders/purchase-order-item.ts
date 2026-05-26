import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface PurchaseOrderItem {
  id: number;
  materialId: number;
  materialName: string;
  indentItemId?: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice?: number;
  totalPrice?: number;
  remarks?: string;
}

/** Used when creating items inline as part of a new PO payload */
export interface InlinePurchaseOrderItemInput {
  materialId: number;
  indentItemId?: number;
  orderedQuantity: number;
  unitPrice?: number;
  totalPrice?: number;
  remarks?: string;
}

export function parsePurchaseOrderItem(raw: Raw): PurchaseOrderItem {
  return {
    id: parsePositiveInt(raw.id, 'parsePurchaseOrderItem.id'),
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    indentItemId: raw.indentItemId ?? undefined,
    orderedQuantity: raw.orderedQuantity,
    receivedQuantity: raw.receivedQuantity ?? 0,
    unitPrice: raw.unitPrice ?? undefined,
    totalPrice: raw.totalPrice ?? undefined,
    remarks: raw.remarks ?? undefined,
  };
}
