// TODO: Phase 9 — implement createEmployeeToJson and replace Partial<Employee> in employee-service
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
