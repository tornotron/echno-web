import type { StorageLocation } from '@tornotron/echno-core/storage-locations/types';

/**
 * Which storage locations may be booked against a given project.
 *
 * `useStorageLocations()` returns every location in the organisation, and the
 * forms rendered all of them regardless of the project selected. That is how a
 * consumption came to be booked against project 3 at location 14, a pairing
 * that has never held stock and never can, because location 14 belongs to no
 * project at all.
 *
 * A location with no `projectId` is treated as organisation-level and offered
 * from every project. The alternative reading, that it belongs to no project
 * and so is selectable from none, would make more than half the locations on
 * staging unusable (7 of 13 carry a null project) and give the user an empty
 * dropdown with nothing to do about it. Where those rows should really be
 * owned by a project, the fix is to populate the column, not to hide them.
 *
 * This mirrors what the backend ought to enforce (echno-backend#529 and #533);
 * until it does, the filter narrows the choice rather than guaranteeing it.
 *
 * @param locations - Every storage location in the organisation.
 * @param projectId - The selected project. Falsy means no project chosen yet,
 *   which leaves only the organisation-level locations, since a project-owned
 *   location means nothing without its project.
 */
export function storageLocationsForProject(
  locations: StorageLocation[],
  projectId: number
): StorageLocation[] {
  return locations.filter(
    (location) =>
      location.projectId == null ||
      (Boolean(projectId) && location.projectId === projectId)
  );
}
