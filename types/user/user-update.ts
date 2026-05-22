// TODO: Phase 5 — implement UpdateUserRequest, updateUserToJson, and replace partialUserToJson
export interface UpdateUserRequest {
  name?: string;
  address?: string;
  bloodGroup?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  qualification?: string;
  skills?: string[];
  experience?: number;
  emergencyContact?: string;
  certifications?: string[];
  defaultOrganizationId?: number | null;
}
