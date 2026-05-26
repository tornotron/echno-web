import { Department } from './departments';
import { EmployeeStatus } from './employee-status';

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  qualification?: string;
  employeeId?: string;
  designation?: string;
  department?: Department;
  joiningDate?: Date | null;
  organizationId?: number;
  salary?: number | null;
  managerId?: number;
  shiftTiming?: string | null;
  status?: EmployeeStatus;
  skills?: string[];
  experience?: number;
}

export function updateEmployeeToJson(
  dto: UpdateEmployeeRequest
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (dto.name !== undefined) payload.employeeName = dto.name;
  if (dto.email !== undefined) payload.emailAddress = dto.email;
  if (dto.phone !== undefined) payload.phoneNumber = dto.phone;
  if (dto.gender !== undefined) payload.gender = dto.gender;
  if (dto.dateOfBirth !== undefined)
    payload.dateOfBirth = dto.dateOfBirth.toISOString();
  if (dto.address !== undefined) payload.address = dto.address;
  if (dto.qualification !== undefined)
    payload.qualification = dto.qualification;
  if (dto.employeeId !== undefined) payload.employeeId = dto.employeeId;
  if (dto.designation !== undefined) payload.designation = dto.designation;
  if (dto.department !== undefined) payload.department = dto.department;
  if (dto.joiningDate !== undefined) {
    payload.joiningDate =
      dto.joiningDate === null ? null : dto.joiningDate.toISOString();
  }
  if (dto.organizationId !== undefined)
    payload.organizationId = dto.organizationId;
  if (dto.salary !== undefined) {
    payload.salary =
      dto.salary === null
        ? null
        : Number.parseFloat(Number(dto.salary).toFixed(1));
  }
  if (dto.managerId !== undefined) payload.managerId = dto.managerId;
  if (dto.shiftTiming !== undefined) payload.shiftTiming = dto.shiftTiming;
  if (dto.status !== undefined) payload.status = dto.status;
  if (dto.skills !== undefined) payload.skills = dto.skills;
  if (dto.experience !== undefined) payload.experience = dto.experience;

  return payload;
}
