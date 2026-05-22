// TODO: Phase 12 — implement UpdateStorageLocationRequest (once backend documents update contract)
export interface UpdateStorageLocationRequest {
  locationName?: string;
  locationType?: string;
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  capacity?: number;
  currentUtilization?: number;
  manager?: string;
  contactPhone?: string;
  notes?: string;
}
