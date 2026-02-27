/**
 * types/leave/leave-enums.ts
 *
 * Enumeration types for the leave management system.
 * These enums map directly to backend values.
 */

/**
 * Leave Request Status Enumeration
 */
export enum LeaveStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * Half-Day Type Enumeration
 */
export enum HalfDayType {
  FULL_DAY = 'FULL_DAY',
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF',
}

/**
 * Approval Action Enumeration
 */
export enum ApprovalAction {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  DELEGATED = 'DELEGATED',
}

/**
 * Transaction Type Enumeration
 */
export enum TransactionType {
  OPENING_BALANCE = 'OPENING_BALANCE',
  ACCRUAL = 'ACCRUAL',
  CARRY_FORWARD = 'CARRY_FORWARD',
  DEDUCTION = 'DEDUCTION',
  REVERSAL = 'REVERSAL',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRY = 'EXPIRY',
}

/**
 * Notification Type Enumeration
 */
export enum LeaveNotificationType {
  LEAVE_REQUEST_SUBMITTED = 'LEAVE_REQUEST_SUBMITTED',
  LEAVE_PENDING_APPROVAL = 'LEAVE_PENDING_APPROVAL',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',
  LEAVE_BALANCE_LOW = 'LEAVE_BALANCE_LOW',
  LEAVE_REMINDER = 'LEAVE_REMINDER',
  APPROVAL_DELEGATED = 'APPROVAL_DELEGATED',
}

/**
 * Get display label for leave status
 */
export function getLeaveStatusLabel(status: LeaveStatus): string {
  const labels: Record<LeaveStatus, string> = {
    [LeaveStatus.DRAFT]: 'Draft',
    [LeaveStatus.PENDING_APPROVAL]: 'Pending Approval',
    [LeaveStatus.APPROVED]: 'Approved',
    [LeaveStatus.REJECTED]: 'Rejected',
    [LeaveStatus.CANCELLED]: 'Cancelled',
    [LeaveStatus.WITHDRAWN]: 'Withdrawn',
  };
  return labels[status] ?? String(status);
}

/**
 * Get color class for leave status badge
 */
export function getLeaveStatusColor(status: LeaveStatus): string {
  const colors: Record<LeaveStatus, string> = {
    [LeaveStatus.DRAFT]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    [LeaveStatus.PENDING_APPROVAL]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [LeaveStatus.APPROVED]:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [LeaveStatus.REJECTED]:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    [LeaveStatus.CANCELLED]:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [LeaveStatus.WITHDRAWN]:
      'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[status];
}

/**
 * Get display label for approval action
 */
export function getApprovalActionLabel(action: ApprovalAction): string {
  const labels: Record<ApprovalAction, string> = {
    [ApprovalAction.PENDING]: 'Pending',
    [ApprovalAction.APPROVED]: 'Approved',
    [ApprovalAction.REJECTED]: 'Rejected',
    [ApprovalAction.ESCALATED]: 'Escalated',
    [ApprovalAction.DELEGATED]: 'Delegated',
  };
  return labels[action];
}
