// types/user/user.ts
import { Organization } from '@/types/organization';
import { Attachment, parseAttachment } from '@/types/attachment';

export interface User {
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
  cv?: Attachment;
  emergencyContact?: string;
  organizations?: Organization[];
  roles?: string[];

  profilePicture?: Attachment;
  createdAt?: Date;
  updatedAt?: Date;
}

// ────── Helper Functions ──────
export function userInitials(user: User): string {
  const words = user.name.trim().split(/\s+/);
  let initials = '';
  for (const w of words) if (w) initials += w[0].toUpperCase();
  return initials.length > 2 ? initials.slice(0, 2) : initials;
}

export function skillsAsString(user: User): string {
  return user.skills?.join(', ') ?? '';
}

export function primaryOrganization(user: User): Organization | undefined {
  return user.organizations?.[0];
}

export function belongsToOrganization(user: User, orgId: number): boolean {
  return user.organizations?.some((o) => o.id === orgId) ?? false;
}

export function organizationCount(user: User): number {
  return user.organizations?.length ?? 0;
}

/**
 * Formats a Date object to backend-compatible format: "YYYY-MM-DDTHH:mm:ss"
 * @param date - Date object to format
 * @returns Formatted date string in "YYYY-MM-DDTHH:mm:ss" format
 */
function formatDateForBackend(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00`;
}

// ────── JSON Parsing & Serialization ──────
function parseSkills(data: unknown): string[] {
  if (!data) return [];
  if (typeof data === 'string') {
    return data
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(data)) {
    return data
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(data)];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseUser(json: any): User {
  return {
    id: json.id ?? undefined,
    name: json.name ?? 'Not Specified',
    address: json.address ?? 'Not Specified',
    bloodGroup: json.bloodGroup ?? undefined,
    email: json.email ?? 'Not Specified',
    phone: json.phone ?? 'Not Specified',
    gender: json.gender ?? 'Not Specified',
    dateOfBirth: json.dateOfBirth ? new Date(json.dateOfBirth) : new Date(),
    qualification: json.qualification ?? 'Not Specified',
    skills: json.skills ? parseSkills(json.skills) : undefined,
    experience: json.experience ?? undefined,
    cv: json.cv ? parseAttachment(json.cv) : undefined,
    emergencyContact: json.emergencyContact ?? undefined,
    organizations: json.organizations
      ? (json.organizations as Organization[])
      : undefined,
    roles: json.roles ? (json.roles as string[]) : undefined,
    profilePicture:
      json.profilePicture || json.profilePictureUrl
        ? parseAttachment(json.profilePicture || json.profilePictureUrl)
        : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}

export function userToJson(user: User): Record<string, unknown> {
  return {
    id: user.id,
    name: user.name,
    address: user.address,
    bloodGroup: user.bloodGroup,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth
      ? formatDateForBackend(user.dateOfBirth)
      : undefined,
    qualification: user.qualification,
    skills: user.skills?.join(', '),
    experience: user.experience,
    emergencyContact: user.emergencyContact,
    organizations: user.organizations?.map((o) => o.id),
    roles: user.roles,
    // Note: cv and profilePicture are not sent - file uploads handled via multipart
  };
}

/**
 * Convert partial user data to JSON for API requests.
 * Only includes fields that are actually provided in the partial user object.
 * Note: File uploads are handled separately via multipart form data.
 */
export function partialUserToJson(
  user: Partial<User>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (user.id !== undefined) payload.id = user.id;
  if (user.name !== undefined) payload.name = user.name;
  if (user.address !== undefined) payload.address = user.address;
  if (user.bloodGroup !== undefined) payload.bloodGroup = user.bloodGroup;
  if (user.email !== undefined) payload.email = user.email;
  if (user.phone !== undefined) payload.phone = user.phone;
  if (user.gender !== undefined) payload.gender = user.gender;
  if (user.dateOfBirth !== undefined) {
    payload.dateOfBirth = formatDateForBackend(user.dateOfBirth);
  }
  if (user.qualification !== undefined)
    payload.qualification = user.qualification;
  if (user.skills !== undefined) payload.skills = user.skills.join(', ');
  if (user.experience !== undefined) payload.experience = user.experience;
  if (user.emergencyContact !== undefined)
    payload.emergencyContact = user.emergencyContact;
  if (user.organizations !== undefined) {
    payload.organizations = user.organizations.map((o) => o.id);
  }
  if (user.roles !== undefined) payload.roles = user.roles;
  // Note: cv and profilePicture are not sent - file uploads handled via multipart

  return payload;
}
