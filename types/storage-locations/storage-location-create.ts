// TODO: Phase 12 — implement createStorageLocationToJson
// Backend contract: POST /api/v1/storage-locations/web, docs/backend-api-docs.md §8
export interface CreateStorageLocationRequest {
  locationName: string;
  locationType: string;
  address: string;
  city: string;
  country: string;
  state?: string;
  capacity?: number;
  currentUtilization?: number;
  manager?: string;
  contactPhone?: string;
  notes?: string;
}
