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
 * echno-backend#554 settled this and now refuses the wrong pairing with a 400,
 * so the filter and the server agree: it keeps the choice off the screen
 * rather than leaving the user to discover it on submit.
 *
 * It lives in `lib` rather than under one feature because both the consumption
 * form and the site-transfer form need it, and a feature may not import across
 * into a sibling.
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
