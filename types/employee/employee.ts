// types/employee/employee.ts
/**
 * types/employee/employee.ts
 *
 * Domain model and JSON (de)serialization helpers for `Employee`.
 *
 * This module defines the `Employee` interface used across the frontend and
 * robust helper functions for parsing backend JSON into typed objects
 * (`parseEmployee`) and serializing objects back to backend-compatible JSON
 * (`employeeToJson`). All parsing functions are defensive and intended to
 * handle real-world backend inconsistencies.
 *
 * Conventions:
 * - Date fields are normalized to `Date` instances.
 * - Numeric fields are coerced when appropriate.
 * - Unknown or missing fields receive safe defaults to avoid runtime errors.
 */

import { Project, parseProject, projectToJson } from '@/types/project';
import { Attachment } from '@/types/attachment';
import { EmployeeStatus, employeeStatusFromString } from './employee-status';
import { Department } from './departments';

/**
 * Employee interface
 * Backend returns complete employee data including user-related fields
 */
export interface Employee {
  // User fields (returned by backend as part of employee)
  id?: number;
  name: string;
  address: string;
  bloodGroup?: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: Date;
  qualification: string;
  skills?: string[];
  experience?: number;
  emergencyContact?: string;
  roles?: string[];
  attachments?: Attachment[];
  cv?: Attachment;
  profilePicture?: Attachment;

  // Employee-specific fields
  employeeId: string;
  organizationId: number;
  organizationName?: string;
  designation: string;
  department: Department;
  salary?: number;
  reportingManager?: string;
  shiftTiming?: string;
  status: EmployeeStatus;
  certifications?: string[];
  joiningDate?: Date;
  currentProjects?: Project[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Note: employeeFromUser removed - backend returns complete employee data
// No need to merge user and employee data separately

// JSON → Employee
// Backend returns complete employee data including all user fields
// Backend field mapping:
// - employeeName → name
// - phoneNumber → phone
// - emailAddress → email
// - role → roles (convert to array)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEmployee(json: any): Employee {
  return {
    id: json.id,
    name: json.employeeName ?? '',
    address: json.address ?? '',
    bloodGroup: json.bloodGroup ?? undefined,
    email: json.emailAddress ?? '',
    phone: json.phoneNumber ?? '',
    gender: json.gender ?? '',
    dateOfBirth: json.dateOfBirth ? new Date(json.dateOfBirth) : new Date(),
    qualification: json.qualification ?? '',
    skills: json.skills ? [...json.skills] : undefined,
    experience: json.experience ? Number(json.experience) : undefined,
    emergencyContact: json.emergencyContact ?? undefined,
    roles: json.role ? [json.role] : undefined,
    attachments: json.attachments ? [...json.attachments] : undefined,
    cv: json.cv ?? undefined,
    profilePicture: json.profilePicture ?? undefined,
    employeeId: json.employeeId ?? json.id?.toString() ?? '',
    organizationId: json.organizationId ?? 0,
    organizationName: json.organizationName ?? undefined,
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
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}

// Employee → JSON
// Maps frontend fields back to backend field names
export function employeeToJson(emp: Employee): Record<string, unknown> {
  return {
    id: emp.id,
    employeeName: emp.name,
    phoneNumber: emp.phone,
    emailAddress: emp.email,
    address: emp.address,
    bloodGroup: emp.bloodGroup,
    gender: emp.gender,
    dateOfBirth: emp.dateOfBirth.toISOString(),
    qualification: emp.qualification,
    skills: emp.skills,
    experience: emp.experience,
    emergencyContact: emp.emergencyContact,
    role: emp.roles?.[0], // Convert array back to single role
    employeeId: emp.employeeId,
    organizationId: emp.organizationId,
    organizationName: emp.organizationName,
    designation: emp.designation,
    department: emp.department,
    joiningDate: emp.joiningDate?.toISOString(),
    salary: emp.salary,
    reportingManager: emp.reportingManager,
    shiftTiming: emp.shiftTiming,
    status: emp.status,
    certifications: emp.certifications,
    currentProjects: emp.currentProjects?.map((p) => projectToJson(p)),
    createdAt: emp.createdAt?.toISOString(),
    updatedAt: emp.updatedAt?.toISOString(),
  };
}

// Getters
export function isActive(emp: Employee): boolean {
  return emp.status === EmployeeStatus.active;
}
