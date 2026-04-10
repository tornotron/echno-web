import { SiteTransferStatus } from './enums';
import type {
  SiteTransferItem,
  CreateSiteTransferItemInput,
} from './site-transfer-item';
import { parseSiteTransferItem } from './site-transfer-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface SiteTransfer {
  id: number;
  transferNumber: string;
  issueDate: string;
  sendingPerson: { id: number; name: string };
  sendingProjectId?: number;
  sendingProjectName?: string;
  sendingStorageLocationId?: number;
  sendingStorageLocationName?: string;
  receivingProjectId?: number;
  receivingProjectName?: string;
  receivingStorageLocationId?: number;
  receivingStorageLocationName?: string;
  status: SiteTransferStatus;
  items: SiteTransferItem[];
}

export interface CreateSiteTransferInput {
  transferNumber: string;
  issueDate: string;
  sendingPerson: number;
  sendingProjectId: number;
  sendingStorageLocationId: number;
  receivingProjectId: number;
  receivingStorageLocationId: number;
  status: SiteTransferStatus;
  items: CreateSiteTransferItemInput[];
}

export function parseSiteTransfer(raw: Raw): SiteTransfer {
  return {
    id: raw.id,
    transferNumber: raw.transferNumber,
    issueDate: raw.issueDate,
    sendingPerson: {
      id: raw.sendingPerson?.id ?? 0,
      name: raw.sendingPerson?.employeeName ?? raw.sendingPerson?.name ?? '',
    },
    sendingProjectId: raw.sendingProjectId ?? undefined,
    sendingProjectName: raw.sendingProjectName ?? undefined,
    sendingStorageLocationId: raw.sendingStorageLocationId ?? undefined,
    sendingStorageLocationName: raw.sendingStorageLocationName ?? undefined,
    receivingProjectId: raw.receivingProjectId ?? undefined,
    receivingProjectName: raw.receivingProjectName ?? undefined,
    receivingStorageLocationId: raw.receivingStorageLocationId ?? undefined,
    receivingStorageLocationName: raw.receivingStorageLocationName ?? undefined,
    status: Object.values(SiteTransferStatus).includes(raw.status)
      ? (raw.status as SiteTransferStatus)
      : SiteTransferStatus.pending,
    items: Array.isArray(raw.items)
      ? raw.items.map((item: Raw) => parseSiteTransferItem(item))
      : [],
  };
}
