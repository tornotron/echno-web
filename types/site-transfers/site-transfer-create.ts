import { SiteTransferStatus } from './enums';
import type { CreateSiteTransferItemRequest } from './site-transfer-item';
import { createSiteTransferItemToJson } from './site-transfer-item';

export interface CreateSiteTransferRequest {
  transferNumber: string;
  issueDate: string;
  sendingPerson: number;
  sendingProjectId: number;
  sendingStorageLocationId: number;
  receivingProjectId: number;
  receivingStorageLocationId: number;
  status: SiteTransferStatus;
  items: CreateSiteTransferItemRequest[];
}

export function createSiteTransferToJson(
  dto: CreateSiteTransferRequest
): Record<string, unknown> {
  return {
    transferNumber: dto.transferNumber,
    issueDate: dto.issueDate,
    sendingPerson: dto.sendingPerson,
    sendingProjectId: dto.sendingProjectId,
    sendingStorageLocationId: dto.sendingStorageLocationId,
    receivingProjectId: dto.receivingProjectId,
    receivingStorageLocationId: dto.receivingStorageLocationId,
    status: dto.status,
    items: dto.items.map((item) => createSiteTransferItemToJson(item)),
  };
}
