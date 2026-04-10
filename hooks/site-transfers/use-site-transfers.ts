/**
 * hooks/site-transfers/use-site-transfers.ts
 *
 * React Query hooks for fetching site transfers.
 */

import { useQuery } from '@tanstack/react-query';
import { siteTransfersService } from '@/services/site-transfers-service';
import { SiteTransferStatus } from '@/types/site-transfers';
import { siteTransferKeys } from './site-transfer-keys';

export const useSiteTransfers = () =>
  useQuery({
    queryKey: siteTransferKeys.lists(),
    queryFn: () => siteTransfersService.getAll(),
  });

export const useSiteTransfersPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: siteTransferKeys.paginated(pageNo, pageSize),
    queryFn: () => siteTransfersService.getAllPaginated(pageNo, pageSize),
  });

export const useSiteTransfer = (id: number) =>
  useQuery({
    queryKey: siteTransferKeys.detail(id),
    queryFn: () => siteTransfersService.getById(id),
    enabled: !!id,
  });

export const useSiteTransfersByStatus = (status: SiteTransferStatus) =>
  useQuery({
    queryKey: siteTransferKeys.byStatus(status),
    queryFn: () => siteTransfersService.getByStatus(status),
    enabled: !!status,
  });

export const useSiteTransfersBySendingProject = (projectId: number) =>
  useQuery({
    queryKey: siteTransferKeys.bySendingProject(projectId),
    queryFn: () => siteTransfersService.getBySendingProject(projectId),
    enabled: projectId > 0,
  });

export const useSiteTransfersByReceivingProject = (projectId: number) =>
  useQuery({
    queryKey: siteTransferKeys.byReceivingProject(projectId),
    queryFn: () => siteTransfersService.getByReceivingProject(projectId),
    enabled: projectId > 0,
  });

export { siteTransferKeys } from './site-transfer-keys';
