// types/third-party/vendor.ts

export enum VendorType {
  material = 'material',
  equipment = 'equipment',
  service = 'service',
  transport = 'transport',
  mixed = 'mixed',
}

export enum VendorStatus {
  active = 'active',
  inactive = 'inactive',
  blacklisted = 'blacklisted',
  pending = 'pending',
}

export enum PaymentTerms {
  immediate = 'immediate',
  net15 = 'net15',
  net30 = 'net30',
  net60 = 'net60',
  net90 = 'net90',
  custom = 'custom',
}

export interface Vendor {
  id: number;
  vendorId: string;
  companyName: string;
  contactPerson: string;
  
  // Contact Information
  phone: string;
  email: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Business Details
  type: VendorType;
  status: VendorStatus;
  category: string[]; // e.g., ['Cement', 'Steel', 'Aggregates']
  
  // Tax & Legal
  gstNumber?: string;
  panNumber?: string;
  taxId?: string;
  registrationNumber?: string;
  
  // Banking
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  
  // Payment Terms
  paymentTerms: PaymentTerms;
  creditLimit?: number;
  creditDays?: number;
  
  // Financial Summary
  totalPurchaseValue?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  
  // Performance Metrics
  rating?: number; // 1-5
  totalOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  onTimeDeliveryRate?: number; // percentage
  
  // Documents
  gstCertificateUrl?: string;
  panCardUrl?: string;
  cancelledChequeUrl?: string;
  contractUrl?: string;
  
  // Relationship
  contractStartDate?: Date;
  contractEndDate?: Date;
  accountManagerName?: string;
  accountManagerPhone?: string;
  
  // Notes
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export function getVendorTypeLabel(type: VendorType): string {
  const map: Record<VendorType, string> = {
    [VendorType.material]: 'Material Supplier',
    [VendorType.equipment]: 'Equipment Supplier',
    [VendorType.service]: 'Service Provider',
    [VendorType.transport]: 'Transport',
    [VendorType.mixed]: 'Mixed',
  };
  return map[type];
}

export function getVendorStatusLabel(status: VendorStatus): string {
  const map: Record<VendorStatus, string> = {
    [VendorStatus.active]: 'Active',
    [VendorStatus.inactive]: 'Inactive',
    [VendorStatus.blacklisted]: 'Blacklisted',
    [VendorStatus.pending]: 'Pending Approval',
  };
  return map[status];
}

export function getVendorStatusColor(status: VendorStatus): string {
  const map: Record<VendorStatus, string> = {
    [VendorStatus.active]: 'green',
    [VendorStatus.inactive]: 'zinc',
    [VendorStatus.blacklisted]: 'red',
    [VendorStatus.pending]: 'orange',
  };
  return map[status];
}

export function getPaymentTermsLabel(terms: PaymentTerms): string {
  const map: Record<PaymentTerms, string> = {
    [PaymentTerms.immediate]: 'Immediate',
    [PaymentTerms.net15]: 'Net 15 Days',
    [PaymentTerms.net30]: 'Net 30 Days',
    [PaymentTerms.net60]: 'Net 60 Days',
    [PaymentTerms.net90]: 'Net 90 Days',
    [PaymentTerms.custom]: 'Custom Terms',
  };
  return map[terms];
}
