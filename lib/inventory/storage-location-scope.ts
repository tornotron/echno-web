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

/**
 * The locations a stock adjustment may be booked at, which is the one document
 * the strict rule above does not fully apply to.
 *
 * `StorageLocationScope.requireUsableForBalanceCorrection` on the backend
 * (echno-backend#572) accepts a location owned by another project when a
 * balance row for this material and project already sits there. The strict rule
 * is written for a movement being made; an adjustment correcting a balance that
 * is already on a wrong pairing is the one case where the wrong pairing is the
 * thing being fixed, and refusing it leaves no way to fix it at all.
 *
 * The client cannot decide it on its own: whether a balance sits at a given
 * location depends on the material and the project, and no endpoint lists the
 * locations holding a balance for a pair (`GET /materials/web/{id}/stock` reads
 * one location at a time, so answering it would mean probing every location for
 * every line). So the widening is a deliberate choice the user makes, not a
 * guess this makes for them: with it off the dropdown is the strict set, and
 * with it on it is every location in the organisation, of which the backend
 * still accepts only those actually holding the balance and refuses the rest by
 * name.
 *
 * @param locations - Every storage location in the organisation.
 * @param projectId - The selected project.
 * @param correctingExistingBalance - Whether the user has said this document
 *   corrects a balance held at a location another project owns.
 * @returns The locations to offer.
 */
export function storageLocationsForAdjustment(
  locations: StorageLocation[],
  projectId: number,
  correctingExistingBalance: boolean
): StorageLocation[] {
  return correctingExistingBalance
    ? locations
    : storageLocationsForProject(locations, projectId);
}

/**
 * Whether a location the document already names is one the strict rule would
 * not offer.
 *
 * A document raised through the API against another project's location is
 * exactly the shape backend#572 permits, and opening it in the form used to
 * drop the location on the floor: it was not among the offered options, so the
 * field reset to its placeholder and whoever saved it moved the correction onto
 * a different balance row. Detecting it turns the widening on for that
 * document, so the location it arrived with survives.
 *
 * @param locations - Every storage location in the organisation.
 * @param projectId - The project on the document.
 * @param locationId - The location on the document, if it names one.
 * @returns True when the document sits outside the strict scope.
 */
export function isOutsideProjectScope(
  locations: StorageLocation[],
  projectId: number,
  locationId?: number
): boolean {
  if (!locationId) return false;
  const known = locations.some((location) => location.id === locationId);
  if (!known) return false;
  return !storageLocationsForProject(locations, projectId).some(
    (location) => location.id === locationId
  );
}
