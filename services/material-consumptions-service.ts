import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  MaterialConsumption,
  ConsumptionType,
  parseMaterialConsumption,
  CreateMaterialConsumptionRequest,
  createMaterialConsumptionToJson,
} from '@/types/materials';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseMaterialConsumption(data: Raw): MaterialConsumption {
  try {
    return parseMaterialConsumption(data);
  } catch (error) {
    logger.error('Failed to parse material consumption:', error);
    throw new ApiError('Failed to process consumption data.', 422);
  }
}

function safeParseMaterialConsumptions(data: Raw): MaterialConsumption[] {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : [];
  if (items.length === 0) return [];
  try {
    return items.map((item: Raw) => parseMaterialConsumption(item));
  } catch (error) {
    logger.error('Failed to parse material consumptions:', error);
    throw new ApiError('Failed to process consumptions data.', 422);
  }
}

export const materialConsumptionsService = {
  async create(
    dto: CreateMaterialConsumptionRequest
  ): Promise<MaterialConsumption> {
    const data = await api.post<Raw>(
      '/material-consumptions/web',
      createMaterialConsumptionToJson(dto)
    );
    return safeParseMaterialConsumption(data);
  },

  async getAll(): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>('/material-consumptions/web');
    return safeParseMaterialConsumptions(data);
  },

  async getAllPaginated(
    pageNo = 0,
    pageSize = 10
  ): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw>('/material-consumptions/web/all', {
      pageNo,
      pageSize,
    });
    return safeParseMaterialConsumptions(data);
  },

  async getById(id: number): Promise<MaterialConsumption> {
    const data = await api.get<Raw>(`/material-consumptions/web/${id}`);
    return safeParseMaterialConsumption(data);
  },

  async getByMaterial(materialId: number): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>(
      `/material-consumptions/web/material/${materialId}`
    );
    return safeParseMaterialConsumptions(data);
  },

  async getByType(type: ConsumptionType): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>(
      `/material-consumptions/web/type/${type}`
    );
    return safeParseMaterialConsumptions(data);
  },

  async getByTask(taskId: number): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>(
      `/material-consumptions/web/task/${taskId}`
    );
    return safeParseMaterialConsumptions(data);
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>('/material-consumptions/web/date-range', {
      startDate,
      endDate,
    });
    return safeParseMaterialConsumptions(data);
  },
};
