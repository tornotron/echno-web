// types/third-party/labour.ts

export enum LabourType {
  daily = 'daily',
  monthly = 'monthly',
  contract = 'contract',
  piece = 'piece',
}

export enum LabourStatus {
  active = 'active',
  inactive = 'inactive',
  onLeave = 'onLeave',
  terminated = 'terminated',
}

export enum SkillLevel {
  unskilled = 'unskilled',
  semiskilled = 'semiskilled',
  skilled = 'skilled',
  highllySkilled = 'highlySkilled',
}

export interface Labour {
  id: number;
  labourId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  
  // Labour Details
  type: LabourType;
  skillLevel: SkillLevel;
  trade: string; // e.g., Mason, Carpenter, Plumber
  status: LabourStatus;
  
  // Rate Information
  dailyRate?: number;
  monthlyRate?: number;
  overtimeRate?: number;
  
  // Contract Details
  contractorName?: string;
  contractorPhone?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  
  // Documents
  idProofUrl?: string;
  photoUrl?: string;
  
  // Work History
  joiningDate: Date;
  exitDate?: Date;
  totalWorkDays?: number;
  
  // Financial
  totalPaid?: number;
  totalDue?: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  
  // Assignment
  currentProject?: string;
  currentSite?: string;
  supervisorName?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export function getLabourTypeLabel(type: LabourType): string {
  const map: Record<LabourType, string> = {
    [LabourType.daily]: 'Daily Wage',
    [LabourType.monthly]: 'Monthly Salary',
    [LabourType.contract]: 'Contract Based',
    [LabourType.piece]: 'Piece Rate',
  };
  return map[type];
}

export function getLabourStatusLabel(status: LabourStatus): string {
  const map: Record<LabourStatus, string> = {
    [LabourStatus.active]: 'Active',
    [LabourStatus.inactive]: 'Inactive',
    [LabourStatus.onLeave]: 'On Leave',
    [LabourStatus.terminated]: 'Terminated',
  };
  return map[status];
}

export function getLabourStatusColor(status: LabourStatus): string {
  const map: Record<LabourStatus, string> = {
    [LabourStatus.active]: 'green',
    [LabourStatus.inactive]: 'zinc',
    [LabourStatus.onLeave]: 'orange',
    [LabourStatus.terminated]: 'red',
  };
  return map[status];
}

export function getSkillLevelLabel(level: SkillLevel): string {
  const map: Record<SkillLevel, string> = {
    [SkillLevel.unskilled]: 'Unskilled',
    [SkillLevel.semiskilled]: 'Semi-Skilled',
    [SkillLevel.skilled]: 'Skilled',
    [SkillLevel.highllySkilled]: 'Highly Skilled',
  };
  return map[level];
}
