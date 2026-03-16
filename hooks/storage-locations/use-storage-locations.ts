/**
 * hooks/storage-locations/use-storage-locations.ts
 *
 * React Query hooks for fetching storage locations.
 */

import { useQuery } from '@tanstack/react-query';
import { storageLocationsService } from '@/services/storage-locations-service';
import { storageLocationKeys } from './storage-location-keys';

export const useStorageLocations = () =>
  useQuery({
    queryKey: storageLocationKeys.lists(),
    queryFn: () => storageLocationsService.getAll(),
  });
