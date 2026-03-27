/**
 * services/materials-service.ts
 *
 * Typed client for materials and material-consumptions backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Material,
  MaterialStock,
  MaterialConsumption,
  CreateMaterialInput,
  CreateMaterialConsumptionInput,
  ConsumptionType,
  parseMaterial,
  parseMaterialWithStock,
  parseMaterialConsumption,
} from '@/types/materials';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseMaterial(data: Raw): Material {
  try {
    return parseMaterial(data);
  } catch (error) {
    logger.error('Failed to parse material:', error);
    throw new ApiError('Failed to process material data.', 422);
  }
}

function extractArray(data: Raw): Raw[] {
  if (Array.isArray(data)) return data;
  // Handle Spring Boot Page response: { content: [...], totalPages, ... }
  if (data && Array.isArray(data.content)) {
    return data.content;
  }
  logger.warn('Materials API returned unexpected format:', {
    type: typeof data,
    keys: data ? Object.keys(data) : null,
  });
  return [];
}

function safeParseMaterials(data: Raw): Material[] {
  const items = extractArray(data);
  if (items.length === 0) return [];
  try {
    return items.map((item) => parseMaterial(item));
  } catch (error) {
    logger.error('Failed to parse materials:', error);
    throw new ApiError('Failed to process materials data.', 422);
  }
}

function safeParseMaterialWithStock(data: Raw): MaterialStock {
  try {
    return parseMaterialWithStock(data);
  } catch (error) {
    logger.error('Failed to parse material with stock:', error);
    throw new ApiError('Failed to process material stock data.', 422);
  }
}

function safeParseMaterialConsumption(data: Raw): MaterialConsumption {
  try {
    return parseMaterialConsumption(data);
  } catch (error) {
    logger.error('Failed to parse material consumption:', error);
    throw new ApiError('Failed to process consumption data.', 422);
  }
}

function safeParseMaterialConsumptions(data: Raw): MaterialConsumption[] {
  const items = extractArray(data);
  if (items.length === 0) return [];
  try {
    return items.map((item) => parseMaterialConsumption(item));
  } catch (error) {
    logger.error('Failed to parse material consumptions:', error);
    throw new ApiError('Failed to process consumptions data.', 422);
  }
}

export const materialsService = {
  // ==================== Materials ====================

  async create(material: CreateMaterialInput): Promise<Material> {
    const data = await api.post<Raw>('/materials/web', material);
    return safeParseMaterial(data);
  },

  async getAll(): Promise<Material[]> {
    const data = await api.get<Raw[]>('/materials/web');
    return safeParseMaterials(data);
  },

  async getAllPaginated(pageNo = 0, pageSize = 10): Promise<Material[]> {
    const data = await api.get<Raw>('/materials/web/all', { pageNo, pageSize });
    return safeParseMaterials(data);
  },

  async search(name: string): Promise<Material[]> {
    const data = await api.get<Raw[]>('/materials/web/search', { name });
    return safeParseMaterials(data);
  },

  async getById(id: number): Promise<Material> {
    const data = await api.get<Raw>(`/materials/web/${id}`);
    return safeParseMaterial(data);
  },

  async getWithStock(id: number): Promise<MaterialStock> {
    const data = await api.get<Raw>(`/materials/web/${id}/stock`);
    return safeParseMaterialWithStock(data);
  },

  async update(id: number, material: CreateMaterialInput): Promise<Material> {
    const data = await api.patch<Raw>(`/materials/web/${id}`, material);
    return safeParseMaterial(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/materials/web/${id}`);
  },

  // ==================== Material Consumptions ====================

  async createConsumption(
    consumption: CreateMaterialConsumptionInput
  ): Promise<MaterialConsumption> {
    const data = await api.post<Raw>('/material-consumptions/web', consumption);
    return safeParseMaterialConsumption(data);
  },

  async getAllConsumptions(): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>('/material-consumptions/web');
    return safeParseMaterialConsumptions(data);
  },

  async getConsumptionsPaginated(
    pageNo = 0,
    pageSize = 10
  ): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw>('/material-consumptions/web/all', {
      pageNo,
      pageSize,
    });
    return safeParseMaterialConsumptions(data);
  },

  async getConsumptionById(id: number): Promise<MaterialConsumption> {
    const data = await api.get<Raw>(`/material-consumptions/web/${id}`);
    return safeParseMaterialConsumption(data);
  },

  async getConsumptionsByMaterial(
    materialId: number
  ): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>(
      `/material-consumptions/web/material/${materialId}`
    );
    return safeParseMaterialConsumptions(data);
  },

  async getConsumptionsByType(
    type: ConsumptionType
  ): Promise<MaterialConsumption[]> {
    const data = await api.get<Raw[]>(
      `/material-consumptions/web/type/${type}`
    );
    return safeParseMaterialConsumptions(data);
  },

  async getConsumptionsByDateRange(
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
