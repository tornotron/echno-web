/**
 * services/grn-service.ts
 *
 * Typed client for Goods Received Notes backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  GoodsReceivedNote,
  CreateGrnInput,
  parseGoodsReceivedNote,
} from '@/types/grn';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseGRN(data: Raw): GoodsReceivedNote {
  try {
    return parseGoodsReceivedNote(data);
  } catch (error) {
    logger.error('Failed to parse GRN:', error);
    throw new ApiError('Failed to process GRN data.', 422);
  }
}

function safeParseGRNs(data: Raw[]): GoodsReceivedNote[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseGoodsReceivedNote(item));
  } catch (error) {
    logger.error('Failed to parse GRNs:', error);
    throw new ApiError('Failed to process GRNs data.', 422);
  }
}

export const grnService = {
  async create(grn: CreateGrnInput): Promise<GoodsReceivedNote> {
    const data = await api.post<Raw>('/grns/web', grn);
    return safeParseGRN(data);
  },

  async getAll(): Promise<GoodsReceivedNote[]> {
    const data = await api.get<Raw[]>('/grns/web');
    return safeParseGRNs(data);
  },

  async getAllPaginated(
    pageNo = 0,
    pageSize = 10
  ): Promise<GoodsReceivedNote[]> {
    const data = await api.get<Raw[]>('/grns/web/all', { pageNo, pageSize });
    return safeParseGRNs(data);
  },

  async getById(id: number): Promise<GoodsReceivedNote> {
    const data = await api.get<Raw>(`/grns/web/${id}`);
    return safeParseGRN(data);
  },

  async getByVendor(vendorId: number): Promise<GoodsReceivedNote[]> {
    const data = await api.get<Raw[]>(`/grns/web/vendor/${vendorId}`);
    return safeParseGRNs(data);
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<GoodsReceivedNote[]> {
    const data = await api.get<Raw[]>('/grns/web/date-range', {
      startDate,
      endDate,
    });
    return safeParseGRNs(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/grns/web/${id}`);
  },
};
