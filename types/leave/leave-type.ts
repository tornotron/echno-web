/**
 * Leave Type Enumeration
 * Defines all available leave types in the organization
 */
export enum LeaveType {
  casualLeave = "casual_leave",
  sickLeave = "sick_leave",
  earnedLeave = "earned_leave",
  maternityLeave = "maternity_leave",
  paternityLeave = "paternity_leave",
  compensatoryOff = "compensatory_off",
  leaveWithoutPay = "leave_without_pay",
}

/**
 * Get display label for leave type
 */
export function getLeaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    [LeaveType.casualLeave]: "Casual Leave (CL)",
    [LeaveType.sickLeave]: "Sick Leave (SL)",
    [LeaveType.earnedLeave]: "Earned Leave (EL/PL)",
    [LeaveType.maternityLeave]: "Maternity Leave",
    [LeaveType.paternityLeave]: "Paternity Leave",
    [LeaveType.compensatoryOff]: "Compensatory Off",
    [LeaveType.leaveWithoutPay]: "Leave Without Pay (LWP)",
  }
  return labels[type]
}

/**
 * Get color class for leave type badge
 */
export function getLeaveTypeColor(type: LeaveType): string {
  const colors: Record<LeaveType, string> = {
    [LeaveType.casualLeave]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    [LeaveType.sickLeave]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    [LeaveType.earnedLeave]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [LeaveType.maternityLeave]: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    [LeaveType.paternityLeave]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    [LeaveType.compensatoryOff]: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    [LeaveType.leaveWithoutPay]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }
  return colors[type]
}

/**
 * Get typical annual quota for leave type (in days)
 */
export function getLeaveTypeQuota(type: LeaveType): number {
  const quotas: Record<LeaveType, number> = {
    [LeaveType.casualLeave]: 12,
    [LeaveType.sickLeave]: 12,
    [LeaveType.earnedLeave]: 21,
    [LeaveType.maternityLeave]: 182, // 26 weeks = 182 days
    [LeaveType.paternityLeave]: 15,
    [LeaveType.compensatoryOff]: 0, // Earned based on work
    [LeaveType.leaveWithoutPay]: 0, // Unlimited but unpaid
  }
  return quotas[type]
}
