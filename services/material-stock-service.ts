import { api } from '@/lib/api/api-client';
import { parseMaterialWithStock } from '@tornotron/echno-core/materials/types';
import type { MaterialWithStock } from '@tornotron/echno-core/materials/types';

/**
 * Scoped reads of `GET /materials/web/{id}/stock`.
 *
 * `echno-core`'s `materialsService.getWithStock` sends the material id alone,
 * which makes the backend fall through to `getMaterialWithAggregateStock`: a
 * SUM over every project and every storage location in the organisation. That
 * total is not the balance any single consumption or transfer is checked
 * against, so a form that shows it can offer a figure the API will reject.
 *
 * The endpoint accepts `projectId` and `storageLocationId` as optional query
 * params and narrows accordingly (both given: the single location row; project
 * only: that project; neither: the organisation total). This service exposes
 * the narrowed reads until `echno-core` carries them.
 */
export const materialStockService = {
  /**
   * Stock for a material at one storage location within one project, which is
   * the row `InventoryService.getStockAtLocation` checks on write.
   */
  async getAtLocation(
    materialId: number,
    projectId: number,
    storageLocationId: number
  ): Promise<MaterialWithStock> {
    const data = await api.get<unknown>(`/materials/web/${materialId}/stock`, {
      projectId,
      storageLocationId,
    });
    return parseMaterialWithStock(data);
  },

  /** Stock for a material across one project, summed over its locations. */
  async getForProject(
    materialId: number,
    projectId: number
  ): Promise<MaterialWithStock> {
    const data = await api.get<unknown>(`/materials/web/${materialId}/stock`, {
      projectId,
    });
    return parseMaterialWithStock(data);
  },

  /** Stock for a material across the whole organisation. */
  async getAggregate(materialId: number): Promise<MaterialWithStock> {
    const data = await api.get<unknown>(`/materials/web/${materialId}/stock`);
    return parseMaterialWithStock(data);
  },
};
