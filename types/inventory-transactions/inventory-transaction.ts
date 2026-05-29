import type { InventoryTransactionType } from './enums';
import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface InventoryTransaction {
  id: number;
  transactionDate: string;
  materialId: number;
  materialName: string;
  openingStock: number;
  quantityChanged: number;
  closingStock: number;
  transactionType: InventoryTransactionType;
  referenceNumber?: string;
  remarks?: string;
  projectId: number;
  projectName: string;
  storageLocationId: number;
  storageLocationName: string;
  unitCost: number | null;
  createdBy: { id: number; name: string };
}

export function parseInventoryTransaction(raw: Raw): InventoryTransaction {
  return {
    id: parsePositiveInt(raw.id, 'parseInventoryTransaction.id'),
    transactionDate: raw.transactionDate,
    materialId: raw.materialId,
    materialName: raw.materialName ?? '',
    openingStock: raw.openingStock ?? 0,
    quantityChanged: raw.quantityChanged ?? 0,
    closingStock: raw.closingStock ?? 0,
    transactionType: raw.transactionType as InventoryTransactionType,
    referenceNumber: raw.referenceNumber ?? undefined,
    remarks: raw.remarks ?? undefined,
    projectId: raw.projectId,
    projectName: raw.projectName ?? '',
    storageLocationId: raw.storageLocationId,
    storageLocationName: raw.storageLocationName ?? '',
    unitCost: raw.unitCost ?? null,
    createdBy: {
      id: parsePositiveInt(
        raw.createdBy?.id,
        'parseInventoryTransaction.createdBy.id'
      ),
      name: raw.createdBy?.employeeName ?? '',
    },
  };
}
