import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  WbsElement,
  parseWbsElement,
  CreateWbsElementRequest,
  createWbsElementToJson,
  BulkCreateWbsElementsRequest,
  bulkCreateWbsElementsToJson,
  UpdateWbsElementRequest,
  updateWbsElementToJson,
  MoveWbsElementRequest,
  moveWbsElementToJson,
} from '@/types/wbs-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseWbsElement(data: Raw): WbsElement {
  try {
    return parseWbsElement(data);
  } catch (error) {
    logger.error('Failed to parse WBS element:', error);
    throw new ApiError('Failed to process WBS element data.', 422);
  }
}

function safeParseWbsElements(data: Raw[]): WbsElement[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseWbsElement(item));
  } catch (error) {
    logger.error('Failed to parse WBS elements:', error);
    throw new ApiError('Failed to process WBS elements data.', 422);
  }
}

export const wbsElementService = {
  async getAll(projectId: number): Promise<WbsElement[]> {
    const data = await api.get<Raw[]>(`/project/${projectId}/wbs/web`);
    return safeParseWbsElements(data);
  },

  async getTree(projectId: number): Promise<WbsElement[]> {
    const data = await api.get<Raw[]>(`/project/${projectId}/wbs/web/tree`);
    return safeParseWbsElements(data);
  },

  async getLeaves(projectId: number): Promise<WbsElement[]> {
    const data = await api.get<Raw[]>(`/project/${projectId}/wbs/web/leaves`);
    return safeParseWbsElements(data);
  },

  async getById(projectId: number, elementId: number): Promise<WbsElement> {
    const data = await api.get<Raw>(
      `/project/${projectId}/wbs/web/${elementId}`
    );
    return safeParseWbsElement(data);
  },

  async create(
    projectId: number,
    dto: CreateWbsElementRequest
  ): Promise<WbsElement> {
    const data = await api.post<Raw>(
      `/project/${projectId}/wbs/web`,
      createWbsElementToJson(dto)
    );
    return safeParseWbsElement(data);
  },

  async bulkCreate(
    projectId: number,
    dto: BulkCreateWbsElementsRequest
  ): Promise<WbsElement[]> {
    const data = await api.post<Raw[]>(
      `/project/${projectId}/wbs/web/bulk`,
      bulkCreateWbsElementsToJson(dto)
    );
    return safeParseWbsElements(data);
  },

  async update(
    projectId: number,
    elementId: number,
    dto: UpdateWbsElementRequest
  ): Promise<WbsElement> {
    const data = await api.put<Raw>(
      `/project/${projectId}/wbs/web/${elementId}`,
      updateWbsElementToJson(dto)
    );
    return safeParseWbsElement(data);
  },

  async move(
    projectId: number,
    elementId: number,
    dto: MoveWbsElementRequest
  ): Promise<WbsElement> {
    const data = await api.post<Raw>(
      `/project/${projectId}/wbs/web/${elementId}/move`,
      moveWbsElementToJson(dto)
    );
    return safeParseWbsElement(data);
  },

  async recalculate(projectId: number, elementId: number): Promise<WbsElement> {
    const data = await api.post<Raw>(
      `/project/${projectId}/wbs/web/${elementId}/recalculate`,
      {}
    );
    return safeParseWbsElement(data);
  },

  async delete(projectId: number, elementId: number): Promise<void> {
    await api.delete(`/project/${projectId}/wbs/web/${elementId}`);
  },
};
