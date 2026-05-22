// TODO: Phase 11 — implement SetVendorPaymentTermsRequest
// Backend §1.3
export interface SetVendorPaymentTermsRequest {
  paymentTermsType: string;
  creditLimit: number;
  discountPercentage?: number;
  discountDays?: number;
  notes?: string;
}
