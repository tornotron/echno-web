export interface GenerateInviteCodeRequest {
  designation: string;
  department: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;
  phone?: string;
  joiningDate?: Date;
  salary?: number;
  managerId?: number;
  shiftTiming?: string;
  status?: string;
  validityDays?: number;
  maxUses?: number;
}
