import { Employee, employeeToJson, parseEmployee } from '@/types/employee';
import { Project, projectToJson, parseProject } from '@/types/project';

export interface Organization {
  id?: number;
  organizationName: string;
  organizationAddress: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationWebsite?: string;
  organizationLogo?: string;
  employees?: Employee[];
  projects?: Project[];
  creatorId: number;
  createdAt?: Date;
  isActive: boolean;
  type: 'client' | 'internal';
}

/** -------------------------------------------------------------
 *  JSON → Organization
 *  ------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOrganization(json: any): Organization {
  return {
    id: json.id ?? undefined,
    organizationName: json.organizationName ?? '',
    organizationAddress: json.organizationAddress ?? '',
    organizationEmail: json.organizationEmail ?? '',
    organizationPhone: json.organizationPhone ?? '',
    organizationWebsite: json.organizationWebsite ?? undefined,
    organizationLogo: json.organizationLogo ?? undefined,
    employees: json.employees
      ? (json.employees as unknown[]).map((e) => parseEmployee(e))
      : undefined,
    projects: json.projects
      ? (json.projects as unknown[]).map((p) => parseProject(p))
      : undefined,
    creatorId: json.proprietorId ?? json.creatorId ?? 0,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    isActive: json.isActive ?? true,
    type: json.type ?? 'internal',
  };
}

/** Full JSON (for UI / debug) */
export function organizationToJson(org: Organization): Record<string, unknown> {
  return {
    id: org.id,
    organizationName: org.organizationName,
    organizationAddress: org.organizationAddress,
    organizationEmail: org.organizationEmail,
    organizationPhone: org.organizationPhone,
    organizationWebsite: org.organizationWebsite,
    organizationLogo: org.organizationLogo,
    employees: org.employees?.map((e) => employeeToJson(e)),
    projects: org.projects?.map((p) => projectToJson(p)),
    creatorId: org.creatorId,
    createdAt: org.createdAt?.toISOString(),
    isActive: org.isActive,
    type: org.type,
  };
}

/** Minimal JSON with only IDs (for API POST/PUT) */
export function organizationToJsonWithIds(
  org: Organization
): Record<string, unknown> {
  return {
    id: org.id,
    organizationName: org.organizationName,
    organizationAddress: org.organizationAddress,
    organizationEmail: org.organizationEmail,
    organizationPhone: org.organizationPhone,
    organizationWebsite: org.organizationWebsite,
    organizationLogo: org.organizationLogo,
    creatorId: org.creatorId,
    createdAt: org.createdAt?.toISOString(),
    isActive: org.isActive,
    type: org.type,
  };
}

/** Format: 01/04/2025 */
export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/** Format: 01/04/2025 14:30 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/** Format: 01-04-2025 */
export function formatDateHyphen(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/** Format: 01-04-2025 14:30 */
export function formatDateTimeHyphen(date: Date): string {
  return `${formatDateHyphen(date)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/** Public getters (like Dart) */
export function formattedCreatedDate(org: Organization): string {
  return org.createdAt ? formatDate(org.createdAt) : '';
}

export function formattedCreatedDateTime(org: Organization): string {
  return org.createdAt ? formatDateTime(org.createdAt) : '';
}

export function formattedCreatedDateHyphen(org: Organization): string {
  return org.createdAt ? formatDateHyphen(org.createdAt) : '';
}

export function formattedCreatedDateTimeHyphen(org: Organization): string {
  return org.createdAt ? formatDateTimeHyphen(org.createdAt) : '';
}
