// TODO: Phase 9 — implement updateEmployeeToJson and replace Partial<Employee> in employee-service
import { Department } from './departments';

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
  joiningDate?: Date;
  organizationId?: number;
  salary?: number;
  managerId?: number;
  shiftTiming?: string;
  skills?: string[];
  experience?: number;
}
