// types/employee/employee.ts
import { User, parseUser, userToJson } from '@/types/user';
import { Project, parseProject, projectToJson } from '@/types/project';
import { Organization } from '@/types/organization';
import { EmployeeStatus, employeeStatusFromString } from './employee-status';
import { Department } from './departments';
import { format, formatDistanceToNow } from 'date-fns';

export interface Employee extends User {
  employeeId: string;
  designation: string;
  department: Department;
  salary?: number;
  reportingManager?: string;
  shiftTiming?: string;
  status: EmployeeStatus;
  certifications?: string[];
  joiningDate?: Date;
  currentProjects?: Project[];
  organizations?: Organization[];
}

// Factory: fromUser
export function employeeFromUser(
  user: User,
  data: {
    employeeId: string;
    designation: string;
    department: Department;
    joiningDate?: Date;
    salary?: number;
    reportingManager?: string;
    shiftTiming?: string;
    status?: EmployeeStatus;
    certifications?: string[];
    currentProjects?: Project[];
    organizations?: Organization[];
  }
): Employee {
  return {
    ...user,
    employeeId: data.employeeId,
    designation: data.designation,
    department: data.department,
    joiningDate: data.joiningDate,
    salary: data.salary,
    reportingManager: data.reportingManager,
    shiftTiming: data.shiftTiming,
    status: data.status ?? EmployeeStatus.active,
    certifications: data.certifications,
    currentProjects: data.currentProjects,
    organizations: data.organizations,
  };
}

// JSON → Employee
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEmployee(json: any): Employee {
  const baseUser = parseUser(json);
  return {
    ...baseUser,
    employeeId: json.employeeId ?? '',
    designation: json.designation ?? '',
     
    department:
      json.department && json.department in Department
        ? Department[json.department as keyof typeof Department]
        : Department.engineering,
    joiningDate: json.joiningDate ? new Date(json.joiningDate) : undefined,
    salary: json.salary == null ? undefined : Number(json.salary),
    reportingManager: json.reportingManager ?? undefined,
    shiftTiming: json.shiftTiming ?? undefined,
    status: employeeStatusFromString(json.status ?? 'active'),
    certifications: json.certifications ? [...json.certifications] : undefined,
    currentProjects: json.currentProjects
      ? (json.currentProjects as unknown[]).map((p) => parseProject(p))
      : undefined,
  };
}

// Employee → JSON
export function employeeToJson(emp: Employee): Record<string, unknown> {
  const userJson = userToJson(emp);
  return {
    ...userJson,
    employeeId: emp.employeeId,
    designation: emp.designation,
    department: emp.department,
    joiningDate: emp.joiningDate?.toISOString(),
    salary: emp.salary,
    reportingManager: emp.reportingManager,
    shiftTiming: emp.shiftTiming,
    status: emp.status,
    certifications: emp.certifications,
    currentProjects: emp.currentProjects?.map((p) => projectToJson(p)),
  };
}

// Getters
export function displayName(emp: Employee): string {
  return `${emp.name} (${emp.employeeId})`;
}

export function yearsOfService(emp: Employee): number {
  if (!emp.joiningDate) return 0;
  return new Date().getFullYear() - emp.joiningDate.getFullYear();
}

export function isActive(emp: Employee): boolean {
  return emp.status === EmployeeStatus.active;
}

// copyWith
export function copyEmployee(
  emp: Employee,
  updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>
): Employee {
  return { ...emp, ...updates };
}

// Date formatting (equivalent to EchnoDateFormatter)
export function formatDateMedium(date: Date): string {
  return format(date, 'dd MMM yyyy');
}

export function formatDateMediumHyphen(date: Date): string {
  return format(date, 'dd-MM-yyyy');
}

export function formatDateTimeMediumHyphen(date: Date): string {
  return format(date, 'dd-MM-yyyy HH:mm');
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

// Public formatted getters
export function formattedJoiningDate(emp: Employee): string | null {
  return emp.joiningDate ? formatDateMedium(emp.joiningDate) : null;
}

export function formattedJoiningDateHyphen(emp: Employee): string | null {
  return emp.joiningDate ? formatDateMediumHyphen(emp.joiningDate) : null;
}

export function formattedDateOfBirth(emp: Employee): string {
  return formatDateMedium(emp.dateOfBirth);
}

export function formattedCreatedTime(emp: Employee): string | null {
  return emp.createdAt ? formatRelativeTime(emp.createdAt) : null;
}

export function formattedUpdatedTime(emp: Employee): string | null {
  return emp.updatedAt ? formatRelativeTime(emp.updatedAt) : null;
}

export function formattedJoiningDateTime(emp: Employee): string | null {
  return emp.joiningDate ? formatDateTimeMediumHyphen(emp.joiningDate) : null;
}

// Reuse User helpers

export { primaryOrganization, belongsToOrganization } from '@/types/user';
