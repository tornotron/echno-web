/**
 * Query keys for scoped material-stock reads.
 *
 * Deliberately separate from `echno-core`'s `materialsKeys.stock(id)`, which
 * caches the organisation-wide aggregate under the material id alone. The
 * scope is part of the answer here, so it has to be part of the key: caching
 * a location balance where the aggregate lives would hand the wrong number to
 * every other reader of that entry.
 */
export const materialStockKeys = {
  all: ['material-stock'] as const,
  atLocation: (
    materialId: number,
    projectId: number,
    storageLocationId: number
  ) =>
    [
      ...materialStockKeys.all,
      'location',
      materialId,
      projectId,
      storageLocationId,
    ] as const,
  forProject: (materialId: number, projectId: number) =>
    [...materialStockKeys.all, 'project', materialId, projectId] as const,
};
