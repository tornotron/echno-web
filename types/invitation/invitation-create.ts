// TODO: implement generateInviteCodeToJson before calling api.post — Date fields (joiningDate)
// must be serialised to ISO strings; mirror the pattern used in createOrganizationToJson /
// createEmployeeToJson / updateIssueToJson (toISOString() or a shared date serialiser).
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
