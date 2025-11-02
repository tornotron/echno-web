// types/user/member.ts
import { UserRole, getUserRoleLabel, userRoleFromString } from '../user';

/**
 * Member – shape only (like Dart class)
 */
export interface Member {
  id?: number;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberRole: string;        // raw string from API
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
  const last = words[words.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

/** -------------------------------------------------------------
 *  Helper: Human-readable role label
 *  Tries to map to UserRole → falls back to legacy mapping
 *  ------------------------------------------------------------- */
export function memberRoleLabel(member: Member): string {
  try {
    const role = userRoleFromString(member.memberRole);
    return getUserRoleLabel(role);
  } catch {
    // Legacy fallback
    const lower = member.memberRole.toLowerCase();
    switch (lower) {
      case 'admin':
      case 'administrator':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'employee':
        return 'Employee';
      default:
        return member.memberRole || 'Unknown';
    }
  }
}

/** -------------------------------------------------------------
 *  JSON → Member
 *  Handles multiple possible field names (like Dart)
 *  ------------------------------------------------------------- */
export function parseMember(json: any): Member {
  return {
    id: json.id ?? undefined,
    memberName:
      json.employeeName ?? json.memberName ?? '',
    memberEmail:
      json.emailAddress ?? json.memberEmail ?? '',
    memberPhone:
      json.phoneNumber ?? json.memberPhone ?? '',
    memberRole:
      json.role ?? json.memberRole ?? '',
    department: json.department ?? 'N/A',
    designation: json.designation ?? 'N/A',
    memberImage:
      json.profilePictureUrl ?? json.memberImage ?? undefined,
  };
}

/** -------------------------------------------------------------
 *  Member → JSON (for POST/PUT)
 *  ------------------------------------------------------------- */
export function memberToJson(member: Member): Record<string, any> {
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