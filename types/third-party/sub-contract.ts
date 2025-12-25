// types/third-party/sub-contract.ts

export enum ContractType {
  lumpsum = 'lumpsum',
  itemRate = 'itemRate',
  timeAndMaterial = 'timeAndMaterial',
  costPlus = 'costPlus',
  unitPrice = 'unitPrice',
}

export enum ContractStatus {
  draft = 'draft',
  active = 'active',
  onHold = 'onHold',
  completed = 'completed',
  terminated = 'terminated',
  expired = 'expired',
}

export enum ContractPaymentStatus {
  notStarted = 'notStarted',
  inProgress = 'inProgress',
  fullyPaid = 'fullyPaid',
  overdue = 'overdue',
}

export interface SubContract {
  id: number;
  contractId: string;
  contractName: string;

  // Contractor Information
  contractorName: string;
  contractorCompany: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;

  // Contract Details
  type: ContractType;
  status: ContractStatus;
  workDescription: string;
  scope: string;

  // Financial
  contractValue: number;
  currency: string;
  mobilizationAdvance?: number;
  retentionPercentage?: number;
  retentionAmount?: number;

  // Payment Details
  paymentStatus: ContractPaymentStatus;
  totalPaid: number;
  totalDue: number;
  advancePaid?: number;

  // Timeline
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  duration: number; // in days

  // Progress
  completionPercentage: number;
  lastMilestone?: string;
  nextMilestone?: string;

  // Project Assignment
  projectName: string;
  projectId: string;
  siteName?: string;
  location: string;

  // Performance
  qualityRating?: number; // 1-5
  timelinessRating?: number; // 1-5
  safetyRating?: number; // 1-5
  overallRating?: number; // 1-5

  // Legal & Compliance
  gstNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date;

  // Banking
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;

  // Financial Tracking
  invoiceIds: number[]; // Foreign keys to Invoice[] (contractor invoices)
  paymentIds: number[]; // Foreign keys to Payment[] (payments made to contractor)
  advancePaymentId?: number; // Foreign key to Payment (for mobilization advance)

  // Documents
  contractDocumentUrl?: string;
  agreementUrl?: string;
  workOrderUrl?: string;
  insuranceUrl?: string;
  licenseUrl?: string;

  // Terms & Conditions
  paymentTerms: string;
  penaltyClause?: string;
  warrantyPeriod?: number; // in months
  defectLiabilityPeriod?: number; // in months

  // Management
  supervisorName?: string;
  supervisorPhone?: string;
  accountManagerName?: string;

  // Safety & Compliance
  safetyIncidents?: number;
  qualityIssues?: number;
  delayDays?: number;

  // Milestones
  milestones?: ContractMilestone[];

  // Notes
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractMilestone {
  id: number;
  name: string;
  description: string;
  targetDate: Date;
  completionDate?: Date;
  paymentPercentage: number;
  amount: number;
  status: 'pending' | 'inProgress' | 'completed' | 'delayed';
  remarks?: string;
}

export function getContractTypeLabel(type: ContractType): string {
  const map: Record<ContractType, string> = {
    [ContractType.lumpsum]: 'Lump Sum',
    [ContractType.itemRate]: 'Item Rate',
    [ContractType.timeAndMaterial]: 'Time & Material',
    [ContractType.costPlus]: 'Cost Plus',
    [ContractType.unitPrice]: 'Unit Price',
  };
  return map[type];
}

export function getContractStatusLabel(status: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    [ContractStatus.draft]: 'Draft',
    [ContractStatus.active]: 'Active',
    [ContractStatus.onHold]: 'On Hold',
    [ContractStatus.completed]: 'Completed',
    [ContractStatus.terminated]: 'Terminated',
    [ContractStatus.expired]: 'Expired',
  };
  return map[status];
}

export function getContractStatusColor(status: ContractStatus): string {
  const map: Record<ContractStatus, string> = {
    [ContractStatus.draft]: 'zinc',
    [ContractStatus.active]: 'green',
    [ContractStatus.onHold]: 'orange',
    [ContractStatus.completed]: 'blue',
    [ContractStatus.terminated]: 'red',
    [ContractStatus.expired]: 'red',
  };
  return map[status];
}

export function getPaymentStatusLabel(status: ContractPaymentStatus): string {
  const map: Record<ContractPaymentStatus, string> = {
    [ContractPaymentStatus.notStarted]: 'Not Started',
    [ContractPaymentStatus.inProgress]: 'In Progress',
    [ContractPaymentStatus.fullyPaid]: 'Fully Paid',
    [ContractPaymentStatus.overdue]: 'Overdue',
  };
  return map[status];
}

export function getPaymentStatusColor(status: ContractPaymentStatus): string {
  const map: Record<ContractPaymentStatus, string> = {
    [ContractPaymentStatus.notStarted]: 'zinc',
    [ContractPaymentStatus.inProgress]: 'blue',
    [ContractPaymentStatus.fullyPaid]: 'green',
    [ContractPaymentStatus.overdue]: 'red',
  };
  return map[status];
}
