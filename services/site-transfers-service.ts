/**
 * services/site-transfers-service.ts
 *
 * Typed client for site transfers backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  SiteTransfer,
  SiteTransferStatus,
  CreateSiteTransferRequest,
  createSiteTransferToJson,
  parseSiteTransfer,
} from '@/types/site-transfers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseSiteTransfer(data: Raw): SiteTransfer {
  try {
    return parseSiteTransfer(data);
  } catch (error) {
    logger.error('Failed to parse site transfer:', error);
    throw new ApiError('Failed to process site transfer data.', 422);
  }
}

function safeParseSiteTransfers(data: Raw[]): SiteTransfer[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseSiteTransfer(item));
  } catch (error) {
    logger.error('Failed to parse site transfers:', error);
    throw new ApiError('Failed to process site transfers data.', 422);
  }
}

export const siteTransfersService = {
  async create(dto: CreateSiteTransferRequest): Promise<SiteTransfer> {
    const data = await api.post<Raw>(
      '/site-transfers/web',
      createSiteTransferToJson(dto)
    );
    return safeParseSiteTransfer(data);
  },

  async getAll(): Promise<SiteTransfer[]> {
    const data = await api.get<Raw[]>('/site-transfers/web');
    return safeParseSiteTransfers(data);
  },

  async getAllPaginated(pageNo = 0, pageSize = 10): Promise<SiteTransfer[]> {
    const data = await api.get<Raw[]>('/site-transfers/web/all', {
      pageNo,
      pageSize,
    });
    return safeParseSiteTransfers(data);
  },

  async getById(id: number): Promise<SiteTransfer> {
    const data = await api.get<Raw>(`/site-transfers/web/${id}`);
    return safeParseSiteTransfer(data);
  },

  async getByStatus(status: SiteTransferStatus): Promise<SiteTransfer[]> {
    const data = await api.get<Raw[]>(`/site-transfers/web/status/${status}`);
    return safeParseSiteTransfers(data);
  },

  async getBySendingProject(projectId: number): Promise<SiteTransfer[]> {
    const data = await api.get<Raw[]>(
      `/site-transfers/web/sending-project/${projectId}`
    );
    return safeParseSiteTransfers(data);
  },

  async getByReceivingProject(projectId: number): Promise<SiteTransfer[]> {
    const data = await api.get<Raw[]>(
      `/site-transfers/web/receiving-project/${projectId}`
    );
    return safeParseSiteTransfers(data);
  },

  async updateStatus(
    id: number,
    status: SiteTransferStatus
  ): Promise<SiteTransfer> {
    const data = await api.patch<Raw>(
      `/site-transfers/web/${id}/status`,
      {},
      { status }
    );
    return safeParseSiteTransfer(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/site-transfers/web/${id}`);
  },
};
