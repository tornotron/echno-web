import { LeaveType } from "./leave-type"

/**
 * Leave Quota Allocation Period
 */
export enum QuotaPeriod {
  monthly = "monthly",
  yearly = "yearly",
}

/**
 * Leave Balance for a specific leave type
 */
export interface LeaveBalance {
  leaveType: LeaveType
  allocated: number // Total allocated for the period
  used: number // Days already taken
  pending: number // Days in pending requests
  available: number // allocated - used - pending
  encashable: number // Days that can be encashed (mainly for EL)
  carriedForward: number // Days carried from previous period
}

/**
 * Employee Leave Quota
 */
export interface EmployeeLeaveQuota {
  employeeId: string
  employeeName: string
  department: string
  period: QuotaPeriod
  year: number
  month?: number // Only for monthly period
  
  // Leave balances by type
  balances: LeaveBalance[]
  
  // Metadata
  effectiveFrom: Date
  effectiveTo: Date
  lastUpdated: Date
}

/**
 * Leave Quota Configuration (for organization/department level)
 */
export interface LeaveQuotaConfig {
  id: string
  organizationId: string
  department?: string // If null, applies to all departments
  leaveType: LeaveType
  
  // Allocation
  annualQuota: number
  period: QuotaPeriod
  
  // Rules
  canCarryForward: boolean
  maxCarryForward?: number
  canEncash: boolean
  minBalanceForEncashment?: number
  
  // Probation
  applicableDuringProbation: boolean
  probationQuota?: number
  
  // Medical certificate requirement
  requiresMedicalCertificate: boolean
  medicalCertificateAfterDays?: number // e.g., required after 3 days
  
  // Advance notice
  minAdvanceNoticeDays: number
  
  // Active status
  isActive: boolean
  effectiveFrom: Date
  effectiveTo?: Date
}

/**
 * Calculate available leave for a specific type
 */
export function calculateAvailableLeave(balance: LeaveBalance): number {
  return balance.allocated + balance.carriedForward - balance.used - balance.pending
}

/**
 * Check if employee has sufficient leave balance
 */
export function hasSufficientBalance(balance: LeaveBalance, requestedDays: number): boolean {
  const available = calculateAvailableLeave(balance)
  return available >= requestedDays
}

/**
 * Get leave balance by type
 */
export function getLeaveBalanceByType(
  quota: EmployeeLeaveQuota,
  leaveType: LeaveType
): LeaveBalance | undefined {
  return quota.balances.find(b => b.leaveType === leaveType)
}

/**
 * Calculate total available leaves across all types
 */
export function getTotalAvailableLeaves(quota: EmployeeLeaveQuota): number {
  return quota.balances.reduce((total, balance) => {
    return total + calculateAvailableLeave(balance)
  }, 0)
}
