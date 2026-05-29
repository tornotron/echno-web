import { parsePositiveInt } from '@/types/parse-id';
import { GrnItem, parseGrnItem } from './grn-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface GoodsReceivedNote {
  id: number;
  grnNumber: string;
  receivedOn: string;
  receivedBy: { id: number; name: string };
  vendorId: number;
  vendorName: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
  projectId?: number;
  projectName?: string;
  storageLocationId?: number;
  storageLocationName?: string;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  items: GrnItem[];
}

export function parseGoodsReceivedNote(raw: Raw): GoodsReceivedNote {
  return {
    id: parsePositiveInt(raw.id, 'parseGoodsReceivedNote.id'),
    grnNumber: raw.grnNumber,
    receivedOn: raw.receivedOn,
    receivedBy: {
      id: parsePositiveInt(
        raw.receivedBy?.id,
        'parseGoodsReceivedNote.receivedBy.id'
      ),
      name: raw.receivedBy?.employeeName ?? raw.receivedBy?.name ?? '',
    },
    vendorId: raw.vendorId,
    vendorName: raw.vendorName ?? '',
    purchaseOrderId: raw.purchaseOrderId ?? undefined,
    purchaseOrderNumber: raw.purchaseOrderNumber ?? undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    storageLocationId: raw.storageLocationId ?? undefined,
    storageLocationName: raw.storageLocationName ?? undefined,
    deliveryChallanNumber: raw.deliveryChallanNumber ?? undefined,
    invoiceNumber: raw.invoiceNumber ?? undefined,
    invoiceAmount: raw.invoiceAmount ?? undefined,
    items: Array.isArray(raw.items)
      ? (raw.items as Raw[]).map((item) => parseGrnItem(item))
      : [],
  };
}
