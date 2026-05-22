// TODO: Phase 11 — implement createVendorToJson and sub-resource create DTOs
// Backend contract: POST /api/v1/vendors/web, docs/backend-api-docs.md §1
export interface CreateVendorRequest {
  vendorName: string;
  vendorCode: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  state?: string;
  zipCode?: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  status?: string;
  notes?: string;
}
