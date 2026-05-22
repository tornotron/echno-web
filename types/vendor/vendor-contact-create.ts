// TODO: Phase 11 — implement CreateVendorContactRequest
// Backend §1.4
export interface CreateVendorContactRequest {
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  department?: string;
  isDefaultContact?: boolean;
}
