// types/vendor/contacts.ts

export interface VendorContact {
  id: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  primary: boolean;
}

export interface CreateVendorContactInput {
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  primary?: boolean;
}
