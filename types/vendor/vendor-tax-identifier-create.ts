// TODO: Phase 11 — implement CreateVendorTaxIdentifierRequest
// Backend §1.2
export interface CreateVendorTaxIdentifierRequest {
  taxIdType: string;
  taxIdValue: string;
  isDefault?: boolean;
  effectiveDate?: Date;
  expiryDate?: Date;
}
