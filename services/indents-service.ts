/**
 * services/indents-service.ts
 *
 * Typed client for indents (requisitions) and indent items endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Indent,
  IndentItem,
  parseIndent,
  parseIndentItem,
  CreateIndentRequest,
  UpdateIndentRequest,
  createIndentToJson,
  updateIndentToJson,
} from '@/types/indents';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseIndent(data: Raw): Indent {
  try {
    return parseIndent(data);
  } catch (error) {
    logger.error('Failed to parse indent:', error);
    throw new ApiError('Failed to process indent data.', 422);
  }
}

function safeParseIndents(data: Raw[]): Indent[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseIndent(item));
  } catch (error) {
    logger.error('Failed to parse indents:', error);
    throw new ApiError('Failed to process indents data.', 422);
  }
}

export const indentsService = {
  // ==================== Indents ====================

  async create(dto: CreateIndentRequest): Promise<Indent> {
    const data = await api.post<Raw>('/indents/web', createIndentToJson(dto));
    return safeParseIndent(data);
  },

  async getAll(): Promise<Indent[]> {
    const data = await api.get<Raw[]>('/indents/web');
    return safeParseIndents(data);
  },

  async getAllPaginated(pageNo = 0, pageSize = 10): Promise<Indent[]> {
    const data = await api.get<Raw[]>('/indents/web/all', { pageNo, pageSize });
    return safeParseIndents(data);
  },

  async getById(id: number): Promise<Indent> {
    const data = await api.get<Raw>(`/indents/web/${id}`);
    return safeParseIndent(data);
  },

  async update(id: number, dto: UpdateIndentRequest): Promise<Indent> {
    const data = await api.patch<Raw>(
      `/indents/web/${id}`,
      updateIndentToJson(dto)
    );
    return safeParseIndent(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/indents/web/${id}`);
  },
};
