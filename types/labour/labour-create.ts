export interface LabourCreateRequest {
  labourID?: string;
  fullName?: string;
  email?: string;
  address?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialization?: string;
  employmentType?: string;
  skillLevel?: string;
  status?: string;
  joiningDate: string;
  currentProjectId?: number;
  dailyRate?: number;
  overTimeRate?: number;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  additionalNotes?: string;
}
