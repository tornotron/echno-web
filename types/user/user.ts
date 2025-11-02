// types/user/user.ts
import { UserRole, userRoleFromString } from './user-role';
import { Organization } from '../organization';;

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
  cvUrl?: string;
  emergencyContact?: string;
  organizations?: Organization[];
  role: UserRole;
  profilePictureUrl?: string;
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
  return user.organizations?.some(o => o.id === orgId) ?? false;
}

export function organizationCount(user: User): number {
  return user.organizations?.length ?? 0;
}

// ────── JSON Parsing & Serialization ──────
function parseSkills(data: any): string[] {
  if (!data) return [];
  if (typeof data === 'string') {
    return data.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(data)) {
    return data.map(String).map(s => s.trim()).filter(Boolean);
  }
  return [String(data)];
}

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
    cvUrl: json.cvUrl ?? undefined,
    emergencyContact: json.emergencyContact ?? undefined,
    organizations: json.organizations
      ? (json.organizations as any[]).map(o => ({
          id: o.id,
          name: o.name,
        }))
      : undefined,
    role: json.role ? userRoleFromString(json.role) : UserRole.laborer,
    profilePictureUrl: json.profilePictureUrl ?? undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}

export function userToJson(user: User): Record<string, any> {
  return {
    id: user.id,
    name: user.name,
    address: user.address,
    bloodGroup: user.bloodGroup,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth.toISOString(),
    qualification: user.qualification,
    skills: user.skills?.join(', '),
    experience: user.experience,
    cvUrl: user.cvUrl,
    emergencyContact: user.emergencyContact,
    organizations: user.organizations?.map(o => ({ id: o.id, name: o.name })),
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}