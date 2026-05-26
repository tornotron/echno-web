import { formatDateForBackend } from './user';

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

export function updateUserToJson(
  dto: UpdateUserRequest
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.address !== undefined) payload.address = dto.address;
  if (dto.bloodGroup !== undefined) payload.bloodGroup = dto.bloodGroup;
  if (dto.phone !== undefined) payload.phone = dto.phone;
  if (dto.gender !== undefined) payload.gender = dto.gender;
  if (dto.dateOfBirth !== undefined)
    payload.dateOfBirth = formatDateForBackend(dto.dateOfBirth);
  if (dto.qualification !== undefined)
    payload.qualification = dto.qualification;
  if (dto.skills !== undefined) payload.skills = dto.skills;
  if (dto.experience !== undefined) payload.experience = dto.experience;
  if (dto.emergencyContact !== undefined)
    payload.emergencyContact = dto.emergencyContact;
  if (dto.certifications !== undefined)
    payload.certifications = dto.certifications;
  if (dto.defaultOrganizationId !== undefined)
    payload.defaultOrganizationId = dto.defaultOrganizationId;
  return payload;
}
