/**
 * echno-core #148: a storage location's capacity is free text with its unit
 * ("5000 sq ft"). Parsed as a number, any location with one failed to parse,
 * which emptied the list and made its detail page say "Location not found".
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { parseStorageLocation } from '@tornotron/echno-core/storage-locations/types';
import { StorageLocationCard } from './storage-location-card';

afterEach(cleanup);

describe('StorageLocationCard', () => {
  test('shows a free-text capacity from the backend as written', () => {
    const location = parseStorageLocation({
      id: 4,
      locationName: 'Disposable Store',
      locationType: 'WAREHOUSE',
      capacity: '5000 sq ft',
      active: true,
    });
    const view = render(<StorageLocationCard location={location} />);
    expect(view.container.textContent).toContain('5000 sq ft');
  });

  test('shows a dash when no capacity is recorded', () => {
    const location = parseStorageLocation({
      id: 5,
      locationName: 'Site store',
      locationType: 'PROJECT_SITE',
      capacity: null,
    });
    const view = render(<StorageLocationCard location={location} />);
    expect(view.container.textContent).toContain('—');
  });
});
