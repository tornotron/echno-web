/**
 * types/invitation/invitation.ts
 *
 * Invitation domain model, helpers and (de)serialization utilities.
 *
 * This module exposes the `Invitation` interface, mapping helpers that
 * convert backend JSON to typed objects (`parseInvitation`) and the inverse
 * (`invitationToJson`). It also contains business helpers that compute
 * invitation state such as expiry and validity checks.
 *
 * Implementation notes:
 * - All date/time fields are normalized to `Date` instances.
 * - Numeric and boolean fallbacks are applied defensively to handle
 *   inconsistent backend payloads.
 */

export enum InvitationStatus {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
  expired = 'expired',
}

/**
 * Employee details nested in invitation
 * Contains all the employee-related information for the invitation
 */
export interface EmployeeDetails {
  department: string;
  designation: string;
  email?: string;
  employeeId?: string;
  employeeName?: string;
  joiningDate?: Date;
  phone?: string;
  managerId?: number;
  salary?: number;
  shiftTiming?: string;
  status?: string;
}

/**
 * Invitation interface
 * Backend field mapping:
 * - code → inviteCode
 * - active → isActive
 * - currentUses → usedCount
 */
export interface Invitation {
  id?: number;
  inviteCode: string;
  expiryDate?: Date;
  maxUses?: number;
  usedCount: number;
  employeeDetails: EmployeeDetails;
  isActive: boolean;
  // Optional fields that might be included in validation response
  organizationId?: number;
  organizationName?: string;
}

/** JSON → Invitation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseInvitation(json: any): Invitation {
  const employeeDetails: EmployeeDetails = {
    department: json.employeeDetails?.department ?? '',
    designation: json.employeeDetails?.designation ?? '',
    email: json.employeeDetails?.email ?? undefined,
    employeeId: json.employeeDetails?.employeeId ?? undefined,
    employeeName: json.employeeDetails?.employeeName ?? undefined,
    joiningDate: json.employeeDetails?.joiningDate
      ? new Date(json.employeeDetails.joiningDate)
      : undefined,
    phone: json.employeeDetails?.phone ?? undefined,
    managerId: json.employeeDetails?.managerId ?? undefined,
    salary:
      json.employeeDetails?.salary == null
        ? undefined
        : Number(json.employeeDetails.salary),
    shiftTiming: json.employeeDetails?.shiftTiming ?? undefined,
    status: json.employeeDetails?.status ?? undefined,
  };

  return {
    id: json.id ?? undefined,
    inviteCode: json.code == null ? '' : String(json.code),
    expiryDate: json.expiryDate ? new Date(json.expiryDate) : undefined,
    maxUses: json.maxUses ?? undefined,
    usedCount: json.currentUses ?? 0,
    employeeDetails,
    isActive: json.active ?? true,
    organizationId: json.organizationId ?? undefined,
    organizationName: json.organizationName ?? undefined,
  };
}

/** Invitation → JSON */
export function invitationToJson(inv: Invitation): Record<string, unknown> {
  return {
    id: inv.id,
    code: inv.inviteCode,
    expiryDate: inv.expiryDate?.toISOString(),
    maxUses: inv.maxUses,
    currentUses: inv.usedCount,
    employeeDetails: {
      department: inv.employeeDetails.department,
      designation: inv.employeeDetails.designation,
      email: inv.employeeDetails.email,
      employeeId: inv.employeeDetails.employeeId,
      employeeName: inv.employeeDetails.employeeName,
      joiningDate: inv.employeeDetails.joiningDate?.toISOString(),
      phone: inv.employeeDetails.phone,
      managerId: inv.employeeDetails.managerId,
      salary: inv.employeeDetails.salary,
      shiftTiming: inv.employeeDetails.shiftTiming,
      status: inv.employeeDetails.status,
    },
    active: inv.isActive,
  };
}

/**
 * Get the computed status of an invitation based on isActive, expiryDate, and maxUses
 */
export function getInvitationStatus(inv: Invitation): InvitationStatus {
  // If explicitly marked as inactive
  if (!inv.isActive) {
    return InvitationStatus.rejected;
  }

  // Check if expired by date
  if (inv.expiryDate && new Date() > inv.expiryDate) {
    return InvitationStatus.expired;
  }

  // Check if max uses reached
  if (inv.maxUses && inv.usedCount && inv.usedCount >= inv.maxUses) {
    return InvitationStatus.accepted;
  }

  // If still active and not expired
  return InvitationStatus.pending;
}

/** Check if invitation is expired */
export function isExpired(inv: Invitation): boolean {
  if (!inv.expiryDate) return false;
  return new Date() > inv.expiryDate;
}

/** Check if invitation is valid and can be used */
export function isInvitationValid(inv: Invitation): boolean {
  // Must be active
  if (!inv.isActive) return false;

  // Must not be expired
  if (isExpired(inv)) return false;

  // Check max uses if applicable
  if (inv.maxUses && inv.usedCount && inv.usedCount >= inv.maxUses) {
    return false;
  }

  return true;
}

/** WhatsApp share message */
export function whatsappMessage(
  inv: Invitation,
  organizationName?: string
): string {
  const lines = [
    '*Employee Invitation*',
    '',
    `You've been invited to join${organizationName ? ` *${organizationName}*` : ' the organization'}!`,
    '',
    `*Position*: ${inv.employeeDetails.designation}`,
    `*Department*: ${inv.employeeDetails.department}`,
  ];

  if (inv.employeeDetails.employeeId) {
    lines.push(`*Employee ID*: ${inv.employeeDetails.employeeId}`);
  }

  if (inv.employeeDetails.joiningDate) {
    const d = inv.employeeDetails.joiningDate;
    lines.push(
      `*Start Date*: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    );
  }
  if (inv.employeeDetails.shiftTiming)
    lines.push(`*Shift Timing*: ${inv.employeeDetails.shiftTiming}`);

  lines.push(
    '',
    `*Invite Code*: *${inv.inviteCode}*`,
    '',
    'Download the Echno Attendance app and use this code to join the organization.'
  );

  return lines.join('\n');
}

/** Email subject */
export function emailSubject(
  inv: Invitation,
  organizationName?: string
): string {
  return `Employee Invitation${organizationName ? ` - ${organizationName}` : ''}`;
}

/** Email body */
export function emailBody(inv: Invitation, organizationName?: string): string {
  const lines = [
    `Dear Employee,`,
    '',
    `You have been invited to join${organizationName ? ` ${organizationName}` : ' the organization'} as a ${inv.employeeDetails.designation} in the ${inv.employeeDetails.department} department.`,
    '',
    'Employee Details:',
  ];

  if (inv.employeeDetails.employeeId) {
    lines.push(`- Employee ID: ${inv.employeeDetails.employeeId}`);
  }
  lines.push(
    `- Position: ${inv.employeeDetails.designation}`,
    `- Department: ${inv.employeeDetails.department}`
  );

  if (inv.employeeDetails.joiningDate) {
    const d = inv.employeeDetails.joiningDate;
    lines.push(
      `- Start Date: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    );
  }
  if (inv.employeeDetails.shiftTiming)
    lines.push(`- Shift Timing: ${inv.employeeDetails.shiftTiming}`);

  lines.push(
    '',
    `Your invitation code is: ${inv.inviteCode}`,
    '',
    'To get started:',
    '1. Download the Echno Attendance mobile app',
    '2. Open the app and select "Join with Invite Code"',
    '3. Enter the code: ' + inv.inviteCode,
    '4. Complete your profile setup',
    '',
    '',
    'Welcome to the team!',
    '',
    'Best regards,',
    'HR Team'
  );

  return lines.join('\n');
}
