import { useQueries, useQuery } from '@tanstack/react-query';
import { materialStockService } from '@/services/material-stock-service';
import type { MaterialWithStock } from '@tornotron/echno-core/materials/types';
import { materialStockKeys } from './material-stock-keys';

/**
 * Key and fetcher for one scoped read, shared by the single and the many hooks
 * so both land on the same cache entry. Two spellings of the same key would
 * mean two requests for one figure and, worse, two answers that can differ.
 */
function materialStockQuery(
  materialId: number,
  projectId: number,
  storageLocationId: number
) {
  return {
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
    enabled: Boolean(materialId) && Boolean(projectId),
  };
}

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
  return useQuery<MaterialWithStock>(
    materialStockQuery(materialId, projectId, storageLocationId)
  );
}

/**
 * The same scoped balance for several materials at once, for a form whose rows
 * each name a material but which share one project and one storage location:
 * the site transfer form's item table is the case this exists for. It has to
 * validate every row against the figure it shows, and a hook cannot be called
 * once per row from the parent.
 *
 * @param materialIds - Materials to read. Duplicates and zeroes are dropped.
 * @param projectId - Project to scope to. Falsy leaves every entry undefined.
 * @param storageLocationId - Storage location to scope to. Falsy widens each
 *   read to the project.
 * @returns Stock by material id; a material still loading is absent.
 */
export function useMaterialStocks(
  materialIds: number[],
  projectId: number,
  storageLocationId: number
) {
  const ids = [...new Set(materialIds.filter(Boolean))];
  return useQueries({
    queries: ids.map((materialId) =>
      materialStockQuery(materialId, projectId, storageLocationId)
    ),
    // Results come back positionally, so the mapping back to material ids has
    // to happen where the id order is known. Doing it in `combine` keeps that
    // pairing next to the queries it came from rather than in the caller.
    combine: (results) => {
      const byMaterialId = new Map<number, MaterialWithStock>();
      for (const [index, result] of results.entries()) {
        if (result.data) byMaterialId.set(ids[index], result.data);
      }
      return byMaterialId;
    },
  });
}
