/**
 * services/indent-items-service.ts
 *
 * Typed client for indent item endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  IndentItem,
  parseIndentItem,
  CreateIndentItemRequest,
  UpdateIndentItemRequest,
  createIndentItemToJson,
  updateIndentItemToJson,
} from '@/types/indents';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseIndentItem(data: Raw): IndentItem {
  try {
    return parseIndentItem(data);
  } catch (error) {
    logger.error('Failed to parse indent item:', error);
    throw new ApiError('Failed to process indent item data.', 422);
  }
}

export const indentItemsService = {
  async getAll(): Promise<IndentItem[]> {
    const data = await api.get<Raw[]>('/indent-items/web');
    if (!Array.isArray(data)) return [];
    return data.map((item) => parseIndentItem(item));
  },

  async getById(id: number): Promise<IndentItem> {
    const data = await api.get<Raw>(`/indent-items/web/${id}`);
    return safeParseIndentItem(data);
  },

  async getByIndent(indentId: number): Promise<IndentItem[]> {
    const data = await api.get<Raw[]>(`/indent-items/web/indent/${indentId}`);
    if (!Array.isArray(data)) return [];
    return data.map((item) => parseIndentItem(item));
  },

  async create(dto: CreateIndentItemRequest): Promise<IndentItem> {
    const data = await api.post<Raw>(
      '/indent-items/web',
      createIndentItemToJson(dto)
    );
    return safeParseIndentItem(data);
  },

  async update(id: number, dto: UpdateIndentItemRequest): Promise<IndentItem> {
    const data = await api.put<Raw>(
      `/indent-items/web/${id}`,
      updateIndentItemToJson(dto)
    );
    return safeParseIndentItem(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/indent-items/web/${id}`);
  },

  async markConverted(
    id: number,
    purchaseOrderNumber: string
  ): Promise<IndentItem> {
    const data = await api.put<Raw>(
      `/indent-items/web/${id}/mark-converted`,
      {},
      { purchaseOrderNumber }
    );
    return safeParseIndentItem(data);
  },
};
