import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Material,
  MaterialStock,
  parseMaterial,
  parseMaterialWithStock,
  CreateMaterialRequest,
  createMaterialToJson,
  UpdateMaterialRequest,
  updateMaterialToJson,
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
  if (data && Array.isArray(data.content)) return data.content;
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

export const materialsService = {
  async create(dto: CreateMaterialRequest): Promise<Material> {
    const data = await api.post<Raw>(
      '/materials/web',
      createMaterialToJson(dto)
    );
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

  async update(id: number, dto: UpdateMaterialRequest): Promise<Material> {
    const data = await api.patch<Raw>(
      `/materials/web/${id}`,
      updateMaterialToJson(dto)
    );
    return safeParseMaterial(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/materials/web/${id}`);
  },
};
