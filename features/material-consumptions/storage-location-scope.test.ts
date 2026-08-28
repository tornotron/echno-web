import { describe, expect, test } from 'bun:test';
import type { StorageLocation } from '@tornotron/echno-core/storage-locations/types';
import { storageLocationsForProject } from './storage-location-scope';

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
