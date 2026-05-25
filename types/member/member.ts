// types/user/member.ts
import { getUserRoleLabel, userRoleFromString } from '../user';
import { getOrgRoleLabel, orgRoleFromString } from '../employee/org-role';

/**
 * Member – shape only (like Dart class)
 */
export interface Member {
  id: number;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberRole: string; // raw string from API
  department: string;
  designation: string;
  memberImage?: string;
}

/** -------------------------------------------------------------
 *  Helper: Get initials (same logic as Dart)
 *  ------------------------------------------------------------- */
export function memberInitials(member: Member): string {
  const words = member.memberName.trim().split(/\s+/);
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0][0].toUpperCase();
  const first = words[0][0];
  const last = (words.at(-1) ?? '')[0];
  return `${first}${last}`.toUpperCase();
}

/** -------------------------------------------------------------
 *  Helper: Human-readable role label
 *  Tries to map to UserRole → falls back to legacy mapping
 *  ------------------------------------------------------------- */
export function memberRoleLabel(member: Member): string {
  // Try UserRole first
  const userRole = userRoleFromString(member.memberRole);
  if (userRole) return getUserRoleLabel(userRole);

  // Try OrgRole (employee organizational roles)
  const orgRole = orgRoleFromString(member.memberRole);
  if (orgRole) return getOrgRoleLabel(orgRole);

  return member.memberRole || 'Unknown';
}

/** -------------------------------------------------------------
 *  JSON → Member
 *  Handles multiple possible field names (like Dart)
 *  ------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMember(json: any): Member {
  return {
    id: Number(json.id),
    memberName: json.employeeName ?? json.memberName ?? '',
    memberEmail: json.emailAddress ?? json.memberEmail ?? '',
    memberPhone: json.phoneNumber ?? json.memberPhone ?? '',
    memberRole: json.role ?? json.memberRole ?? '',
    department: json.department ?? 'N/A',
    designation: json.designation ?? 'N/A',
    memberImage: json.profilePictureUrl ?? json.memberImage ?? undefined,
  };
}

/** -------------------------------------------------------------
 *  Member → JSON (for POST/PUT)
 *  ------------------------------------------------------------- */
export function memberToJson(member: Member): Record<string, unknown> {
  return {
    id: member.id,
    memberName: member.memberName,
    memberEmail: member.memberEmail,
    memberPhone: member.memberPhone,
    memberRole: member.memberRole,
    memberImage: member.memberImage,
    department: member.department,
    designation: member.designation,
  };
}
