export enum EmploymentType {
  DAILY_WAGE = 'DAILY_WAGE',
  MONTHLY = 'MONTHLY',
  CONTRACT = 'CONTRACT',
  PIECE_RATE = 'PIECE_RATE',
}

export enum SkillLevel {
  UNSKILLED = 'UNSKILLED',
  SEMI_SKILLED = 'SEMI_SKILLED',
  SKILLED = 'SKILLED',
  HIGHLY_SKILLED = 'HIGHLY_SKILLED',
}

export enum LabourStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export interface Labour {
  id: number;
  labourId?: string;
  organizationId?: number;
  organizationName?: string;
  fullName?: string;
  email?: string;
  address?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  specialization?: string;
  employmentType?: EmploymentType;
  skillLevel?: SkillLevel;
  status?: LabourStatus;
  joiningDate?: string;
  currentProjectName?: string;
  currentProjectId?: number;
  dailyRate?: number;
  overTimeRate?: number;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  additionalNotes?: string;
  // UI-only fields — never populated by parseLabour
  monthlyRate?: number;
  contractorName?: string;
  contractorPhone?: string;
  totalDue?: number;
  totalPaid?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLabour(raw: any): Labour {
  return {
    id: raw.id,
    // LabourDto uses "labourID" (uppercase); LabourSimpleDto uses "labourId"
    labourId: raw.labourId ?? raw.labourID,
    organizationId: raw.organizationId,
    organizationName: raw.organizationName,
    fullName: raw.fullName,
    email: raw.email,
    address: raw.address,
    phoneNumber: raw.phoneNumber,
    emergencyContactName: raw.emergencyContactName,
    // LabourDto uses "emergencyContactNumber"; LabourCreationDto uses "emergencyContactPhone"
    emergencyContactNumber:
      raw.emergencyContactNumber ?? raw.emergencyContactPhone,
    specialization: raw.specialization,
    employmentType: raw.employmentType as EmploymentType | undefined,
    skillLevel: raw.skillLevel as SkillLevel | undefined,
    status: raw.status as LabourStatus | undefined,
    joiningDate: raw.joiningDate,
    currentProjectName: raw.currentProjectName,
    currentProjectId:
      raw.currentProjectId == null ? undefined : Number(raw.currentProjectId),
    dailyRate: raw.dailyRate,
    overTimeRate: raw.overTimeRate,
    bankAccountNumber: raw.bankAccountNumber,
    bankName: raw.bankName,
    ifscCode: raw.ifscCode,
    additionalNotes: raw.additionalNotes,
  };
}
