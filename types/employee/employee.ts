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
import { Attachment, parseAttachment } from '@/types/attachment';
import { EmployeeStatus, employeeStatusFromString } from './employee-status';
import { Department } from './departments';
import { OrgRole, orgRoleFromString } from './org-role';
import { parsePositiveInt } from '@/types/parse-id';

/**
 * Employee interface
 * Backend returns complete employee data including user-related fields
 */
export interface Employee {
  // User fields (returned by backend as part of employee)
  id: number;
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
  orgRoles: OrgRole[];
  attachments?: Attachment[];
  cv?: Attachment;
  profilePicture?: Attachment;

  // Employee-specific fields
  employeeId: string;
  organizationId: number;
  organizationName?: string;
  designation: string;
  department?: Department;
  salary?: number | null;
  managerId?: number;
  managerName?: string;
  shiftTiming?: string | null;
  status: EmployeeStatus;
  certifications?: string[];
  joiningDate?: Date | null;
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
// - role → role (single position string)
// - orgRoles → orgRoles (authorization roles, UPPERCASE_SNAKE_CASE)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEmployee(json: any): Employee {
  // Parse attachments array from backend
  const attachments: Attachment[] | undefined = json.attachments
    ? (json.attachments as unknown[]).map((att) => parseAttachment(att))
    : undefined;

  // Extract profile picture — use latest by createdAt if multiple exist
  const profilePictureAttachments = attachments?.filter(
    (att) => att.entityType === 'USER_PROFILE_PICTURE'
  );
  const profilePicture =
    profilePictureAttachments && profilePictureAttachments.length > 0
      ? profilePictureAttachments.toSorted(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        )[0]
      : undefined;

  // Extract CV — use latest by createdAt if multiple exist
  const cvAttachments = attachments?.filter(
    (att) => att.entityType === 'USER_CV'
  );
  const cv =
    cvAttachments && cvAttachments.length > 0
      ? cvAttachments.toSorted(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        )[0]
      : undefined;

  const id = parsePositiveInt(json.id, 'parseEmployee.id');

  return {
    id,
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
    orgRoles: Array.isArray(json.orgRoles)
      ? (json.orgRoles as string[])
          .map((role) => orgRoleFromString(role))
          .filter((r): r is OrgRole => r !== undefined)
      : [],
    attachments,
    cv,
    profilePicture,
    employeeId: json.employeeId ?? json.id?.toString() ?? '',
    organizationId: json.organizationId ?? 0,
    organizationName: json.organizationName ?? undefined,
    designation: json.designation ?? '',
    department:
      json.department && json.department in Department
        ? Department[json.department as keyof typeof Department]
        : undefined,
    joiningDate: json.joiningDate ? new Date(json.joiningDate) : undefined,
    salary: json.salary == null ? undefined : Number(json.salary),
    managerId: json.managerId ?? undefined,
    managerName: json.managerName ?? undefined,
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
// Supports partial employee objects for updates
export function employeeToJson(
  emp: Employee | Partial<Employee>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Only include fields that are defined
  if (emp.name !== undefined) result.employeeName = emp.name;
  if (emp.phone !== undefined) result.phoneNumber = emp.phone;
  if (emp.email !== undefined) result.emailAddress = emp.email;
  if (emp.address !== undefined) result.address = emp.address;
  if (emp.bloodGroup !== undefined) result.bloodGroup = emp.bloodGroup;
  if (emp.gender !== undefined) result.gender = emp.gender;
  if (emp.dateOfBirth !== undefined)
    result.dateOfBirth = emp.dateOfBirth.toISOString();
  if (emp.qualification !== undefined) result.qualification = emp.qualification;
  if (emp.skills !== undefined) result.skills = emp.skills;
  if (emp.experience !== undefined) result.experience = emp.experience;
  if (emp.emergencyContact !== undefined)
    result.emergencyContact = emp.emergencyContact;
  if (emp.orgRoles !== undefined) result.orgRoles = emp.orgRoles;
  if (emp.employeeId !== undefined) result.employeeId = emp.employeeId;
  if (emp.organizationId !== undefined)
    result.organizationId = emp.organizationId;
  if (emp.organizationName !== undefined)
    result.organizationName = emp.organizationName;
  if (emp.designation !== undefined) result.designation = emp.designation;
  if (emp.department !== undefined) result.department = emp.department;
  if (emp.joiningDate !== undefined) {
    result.joiningDate =
      emp.joiningDate === null ? null : emp.joiningDate.toISOString();
  }
  // Ensure salary is treated as a floating-point number by the backend
  if (emp.salary !== undefined) {
    // Parse as float with fixed precision to ensure Java backend treats it as Double
    result.salary =
      emp.salary === null
        ? null
        : Number.parseFloat(Number(emp.salary).toFixed(1));
  }
  if (emp.managerId !== undefined) result.managerId = emp.managerId;
  if (emp.managerName !== undefined) result.managerName = emp.managerName;
  if (emp.shiftTiming !== undefined) result.shiftTiming = emp.shiftTiming;
  if (emp.status !== undefined) result.status = emp.status;
  if (emp.certifications !== undefined)
    result.certifications = emp.certifications;
  if (emp.currentProjects !== undefined) {
    result.currentProjects = emp.currentProjects.map((p) => projectToJson(p));
  }
  if (emp.createdAt !== undefined)
    result.createdAt = emp.createdAt.toISOString();
  if (emp.updatedAt !== undefined)
    result.updatedAt = emp.updatedAt.toISOString();

  return result;
}

// Getters
export function isActive(emp: Employee): boolean {
  return emp.status === EmployeeStatus.active;
}
