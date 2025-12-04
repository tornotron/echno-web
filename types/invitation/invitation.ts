// types/invitation/invitation.ts
import { EmployeeStatus, employeeStatusFromString } from '@/types/employee';

export interface Invitation {
  inviteCode: string;
  employeeId: string;
  designation: string;
  department: string;
  organizationId: string;
  organizationName: string;
  status: EmployeeStatus;
  joiningDate?: Date;
  salary?: number;
  reportingManager?: string;
  shiftTiming?: string;
  validityDays?: number;
  expiryDate?: Date;
  maxUses?: number;
}

/** JSON → Invitation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseInvitation(json: any): Invitation {
  return {
    inviteCode: json.inviteCode ?? '',
    employeeId: json.employeeId ?? '',
    designation: json.designation ?? '',
    department: json.department ?? '',
    joiningDate: json.joiningDate ? new Date(json.joiningDate) : undefined,
    salary: json.salary == null ? undefined : Number(json.salary),
    reportingManager: json.reportingManager ?? undefined,
    shiftTiming: json.shiftTiming ?? undefined,
    organizationId: json.organizationId ?? '',
    organizationName: json.organizationName ?? '',
    status: employeeStatusFromString(json.status ?? 'active'),
    validityDays: json.validityDays ?? undefined,
    expiryDate: json.expiryDate ? new Date(json.expiryDate) : undefined,
    maxUses: json.maxUses ?? undefined,
  };
}

/** Invitation → JSON */
export function invitationToJson(inv: Invitation): Record<string, unknown> {
  return {
    inviteCode: inv.inviteCode,
    employeeId: inv.employeeId,
    designation: inv.designation,
    department: inv.department,
    joiningDate: inv.joiningDate?.toISOString(),
    salary: inv.salary,
    reportingManager: inv.reportingManager,
    shiftTiming: inv.shiftTiming,
    organizationId: inv.organizationId,
    organizationName: inv.organizationName,
    status: inv.status,
    validityDays: inv.validityDays,
    expiryDate: inv.expiryDate?.toISOString(),
    maxUses: inv.maxUses,
  };
}

/** copyWith – immutable update */
export function copyInvitation(
  inv: Invitation,
  updates: Partial<Invitation>
): Invitation {
  return { ...inv, ...updates };
}

/** Check if invitation is expired */
export function isExpired(inv: Invitation): boolean {
  if (!inv.expiryDate) return false;
  return new Date() > inv.expiryDate;
}

/** WhatsApp share message */
export function whatsappMessage(inv: Invitation): string {
  const lines = [
    '*Employee Invitation*',
    '',
    `You've been invited to join *${inv.organizationName}*!`,
    '',
    `*Position*: ${inv.designation}`,
    `*Department*: ${inv.department}`,
    `*Employee ID*: ${inv.employeeId}`,
  ];

  if (inv.joiningDate) {
    const d = inv.joiningDate;
    lines.push(
      `*Start Date*: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    );
  }
  if (inv.reportingManager)
    lines.push(`*Reporting Manager*: ${inv.reportingManager}`);
  if (inv.shiftTiming) lines.push(`*Shift Timing*: ${inv.shiftTiming}`);

  lines.push(
    '',
    `*Invite Code*: *${inv.inviteCode}*`,
    '',
    'Download the Echno Attendance app and use this code to join the organization.'
  );

  return lines.join('\n');
}

/** Email subject */
export function emailSubject(inv: Invitation): string {
  return `Employee Invitation - ${inv.organizationName}`;
}

/** Email body */
export function emailBody(inv: Invitation): string {
  const lines = [
    `Dear Employee,`,
    '',
    `You have been invited to join ${inv.organizationName} as a ${inv.designation} in the ${inv.department} department.`,
    '',
    'Employee Details:',
    `- Employee ID: ${inv.employeeId}`,
    `- Position: ${inv.designation}`,
    `- Department: ${inv.department}`,
  ];

  if (inv.joiningDate) {
    const d = inv.joiningDate;
    lines.push(
      `- Start Date: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    );
  }
  if (inv.reportingManager)
    lines.push(`- Reporting Manager: ${inv.reportingManager}`);
  if (inv.shiftTiming) lines.push(`- Shift Timing: ${inv.shiftTiming}`);

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
    inv.organizationName
  );

  return lines.join('\n');
}
