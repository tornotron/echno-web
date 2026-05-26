import { Department } from './departments';

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: Date;
  address: string;
  qualification: string;
  employeeId: string;
  designation: string;
  department: Department;
  joiningDate: Date;
  organizationId: number;
  salary?: number;
  managerId?: number;
  shiftTiming?: string;
  skills?: string[];
  experience?: number;
}

export function createEmployeeToJson(
  dto: CreateEmployeeRequest
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    employeeName: dto.name,
    emailAddress: dto.email,
    phoneNumber: dto.phone,
    gender: dto.gender,
    dateOfBirth: dto.dateOfBirth.toISOString(),
    address: dto.address,
    qualification: dto.qualification,
    employeeId: dto.employeeId,
    designation: dto.designation,
    department: dto.department,
    joiningDate: dto.joiningDate.toISOString(),
    organizationId: dto.organizationId,
  };

  if (dto.salary !== undefined)
    payload.salary = Number.parseFloat(Number(dto.salary).toFixed(1));
  if (dto.managerId !== undefined) payload.managerId = dto.managerId;
  if (dto.shiftTiming !== undefined) payload.shiftTiming = dto.shiftTiming;
  if (dto.skills !== undefined) payload.skills = dto.skills;
  if (dto.experience !== undefined) payload.experience = dto.experience;

  return payload;
}
