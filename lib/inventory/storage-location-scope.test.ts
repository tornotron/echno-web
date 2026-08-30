import { describe, expect, test } from 'bun:test';
import type { StorageLocation } from '@tornotron/echno-core/storage-locations/types';
import {
  isOutsideProjectScope,
  storageLocationsForAdjustment,
  storageLocationsForProject,
} from './storage-location-scope';

function location(
  id: number,
  locationName: string,
  projectId?: number
): StorageLocation {
  return { id, locationName, projectId } as StorageLocation;
}

/** Shaped after the staging rows: half the locations carry no project. */
const LOCATIONS = [
  location(1, 'Main Yard', 2),
  location(4, 'Riverside Store', 6),
  location(14, 'Godown'),
  location(2, 'Central Warehouse'),
];

describe('storageLocationsForProject', () => {
  test('offers the project its own locations', () => {
    const names = storageLocationsForProject(LOCATIONS, 2).map(
      (l) => l.locationName
    );
    expect(names).toContain('Main Yard');
  });

  test('offers organisation-level locations from any project', () => {
    // The decision this encodes: a null project means organisation-level and
    // usable everywhere, not unusable everywhere. Reading it the other way
    // would empty the dropdown for most of the current data.
    for (const projectId of [2, 6]) {
      const names = storageLocationsForProject(LOCATIONS, projectId).map(
        (l) => l.locationName
      );
      expect(names).toContain('Godown');
      expect(names).toContain('Central Warehouse');
    }
  });

  test('hides locations owned by another project', () => {
    const names = storageLocationsForProject(LOCATIONS, 2).map(
      (l) => l.locationName
    );
    // Booking project 2 against Riverside Store is the pairing that produced
    // "Available: 0.00": no stock row exists for it and none ever will.
    expect(names).not.toContain('Riverside Store');
  });

  test('leaves only organisation-level locations when no project is chosen', () => {
    const names = storageLocationsForProject(LOCATIONS, 0).map(
      (l) => l.locationName
    );
    expect(names).toEqual(['Godown', 'Central Warehouse']);
  });
});

describe('storageLocationsForAdjustment', () => {
  test('an ordinary adjustment sees the strict set', () => {
    const names = storageLocationsForAdjustment(LOCATIONS, 2, false).map(
      (l) => l.locationName
    );
    expect(names).not.toContain('Riverside Store');
  });

  test('a balance correction sees every location in the organisation', () => {
    // The backend accepts a location owned by another project when a balance
    // row already sits there (echno-backend#572), and nothing the client can
    // read says which locations those are: no endpoint lists the locations
    // holding a balance for a material and project. Offering the full set is
    // what makes the correction reachable at all; the backend still refuses a
    // location that holds nothing.
    const names = storageLocationsForAdjustment(LOCATIONS, 2, true).map(
      (l) => l.locationName
    );
    expect(names).toContain('Riverside Store');
    expect(names.length).toBe(LOCATIONS.length);
  });
});

describe('isOutsideProjectScope', () => {
  test("a document on another project's location is outside it", () => {
    // This is the shape raised through the API for issue #563: project 2
    // holding stock at a location project 6 owns.
    expect(isOutsideProjectScope(LOCATIONS, 2, 4)).toBe(true);
  });

  test("a document on its own project's location is not", () => {
    expect(isOutsideProjectScope(LOCATIONS, 2, 1)).toBe(false);
  });

  test('an organisation-level location is not, from any project', () => {
    expect(isOutsideProjectScope(LOCATIONS, 2, 14)).toBe(false);
  });

  test('a document naming no location is not', () => {
    expect(isOutsideProjectScope(LOCATIONS, 2, undefined)).toBe(false);
    expect(isOutsideProjectScope(LOCATIONS, 2, 0)).toBe(false);
  });

  test('a location the list does not carry is not judged at all', () => {
    // The list arrives asynchronously and can be short a row the document
    // names. Reading absence as "outside the project" would silently switch a
    // document into the correction path on a slow query.
    expect(isOutsideProjectScope(LOCATIONS, 2, 999)).toBe(false);
    expect(isOutsideProjectScope([], 2, 4)).toBe(false);
  });
});
