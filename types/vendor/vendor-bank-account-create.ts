// TODO: Phase 11 — implement CreateVendorBankAccountRequest
// Backend §1.5
export interface CreateVendorBankAccountRequest {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType?: string;
  swiftCode?: string;
  isDefaultAccount?: boolean;
  currency?: string;
}
