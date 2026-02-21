import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { WorkCategory, parseWorkCategory } from '@/types/task/work-category';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse work category data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseWorkCategory(data: ApiResponse): WorkCategory {
  try {
    return parseWorkCategory(data);
  } catch (error) {
    logger.error('Failed to parse work category data:', error);
    throw new ApiError(
      'Failed to process work category data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse work category array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseWorkCategories(data: ApiResponse[]): WorkCategory[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseWorkCategory(item));
  } catch (error) {
    logger.error('Failed to parse work categories data:', error);
    throw new ApiError(
      'Failed to process work categories data. Please try again.',
      422
    );
  }
}

/**
 * workCategoryService
 *
 * Thin wrapper around the backend work category REST endpoints.
 */
export const workCategoryService = {
  /**
   * Fetch all work categories.
   */
  async getAll(): Promise<WorkCategory[]> {
    const data = await api.get<ApiResponse[]>('/category/web');
    return safeParseWorkCategories(data);
  },

  /**
   * Fetch a single work category by id.
   */
  async getById(id: number): Promise<WorkCategory> {
    const data = await api.get<ApiResponse>(`/category/web/${id}`);
    return safeParseWorkCategory(data);
  },

  /**
   * Create a new work category.
   */
  async create(category: Partial<WorkCategory>): Promise<WorkCategory> {
    const payload: Record<string, unknown> = {
      name: category.name ?? '',
      description: category.description ?? '',
    };
    if (category.icon) {
      payload.icon = category.icon;
    }
    logger.debug('Creating work category with payload:', payload);
    const data = await api.post<ApiResponse>('/category/web', payload);
    return safeParseWorkCategory(data);
  },

  /**
   * Delete a work category by id.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/category/web/${id}`);
  },
};
