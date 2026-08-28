import { useQuery } from '@tanstack/react-query';
import { materialStockService } from '@/services/material-stock-service';
import type { MaterialWithStock } from '@tornotron/echno-core/materials/types';
import { materialStockKeys } from './material-stock-keys';

/**
 * The balance a write will actually be checked against, narrowed as far as the
 * caller's selections allow:
 *
 * - project and storage location both chosen: the single stock row, which is
 *   what `InventoryService.getStockAtLocation` looks up on write
 * - project only: that project's total across its locations
 * - neither: disabled, because the organisation-wide aggregate is not a figure
 *   any write is validated against and showing it invites the mismatch this
 *   hook exists to avoid
 *
 * @param materialId - Material to read. Falsy disables the query.
 * @param projectId - Project to scope to. Falsy disables the query.
 * @param storageLocationId - Storage location to scope to. Falsy widens the
 *   read to the project.
 */
export function useMaterialStock(
  materialId: number,
  projectId: number,
  storageLocationId: number
) {
  const scoped = Boolean(materialId) && Boolean(projectId);
  return useQuery<MaterialWithStock>({
    queryKey: storageLocationId
      ? materialStockKeys.atLocation(materialId, projectId, storageLocationId)
      : materialStockKeys.forProject(materialId, projectId),
    queryFn: () =>
      storageLocationId
        ? materialStockService.getAtLocation(
            materialId,
            projectId,
            storageLocationId
          )
        : materialStockService.getForProject(materialId, projectId),
    enabled: scoped,
  });
}
