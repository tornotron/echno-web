import { SiteTransferStatus } from '@/types/site-transfers';

export const siteTransferKeys = {
  all: ['site-transfers'] as const,
  lists: () => [...siteTransferKeys.all, 'list'] as const,
  detail: (id: number) => [...siteTransferKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...siteTransferKeys.all, 'paginated', { pageNo, pageSize }] as const,
  byStatus: (status: SiteTransferStatus) =>
    [...siteTransferKeys.all, 'status', status] as const,
  bySendingProject: (projectId: number) =>
    [...siteTransferKeys.all, 'sending-project', projectId] as const,
  byReceivingProject: (projectId: number) =>
    [...siteTransferKeys.all, 'receiving-project', projectId] as const,
};
