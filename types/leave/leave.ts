import { LeaveType } from "./leave-type"
import { LeaveStatus } from "./leave-status"

/**
 * Leave Approver Information
 */
export interface LeaveApprover {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  role: string
  approvedAt?: Date
  rejectedAt?: Date
  comments?: string
}

/**
 * Work Delegation Information
 */
export interface WorkDelegation {
  delegateToId: string
  delegateToName: string
  delegateToEmail: string
  responsibilities: string
  notified: boolean
}

/**
 * Leave Attachment
 */
export interface LeaveAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: Date
}

/**
 * Main Leave Request Interface
 */
export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  department: string
  
  // Leave Details
  leaveType: LeaveType
  fromDate: Date
  toDate: Date
  daysCount: number // Automatically calculated
  reason: string
  
  // Status & Workflow
  status: LeaveStatus
  appliedAt: Date
  
  // Approval Chain
  approvers: LeaveApprover[]
  currentApproverId?: string
  
  // Delegation
  delegation?: WorkDelegation
  
  // Attachments (e.g., medical certificates)
  attachments: LeaveAttachment[]
  
  // Additional Info
  emergencyContact?: string
  remarks?: string
  
  // Audit Trail
  createdAt: Date
  updatedAt: Date
  cancelledAt?: Date
  withdrawnAt?: Date
}

/**
 * Calculate number of days between two dates (excluding weekends)
 */
export function calculateLeaveDays(fromDate: Date, toDate: Date, excludeWeekends: boolean = true): number {
  const start = new Date(fromDate)
  const end = new Date(toDate)
  let count = 0
  
  const current = new Date(start)
  while (current <= end) {
    if (excludeWeekends) {
      const dayOfWeek = current.getDay()
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
    } else {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Check if leave request is actionable by current user
 */
export function canApproveLeave(leave: LeaveRequest, currentUserId: string): boolean {
  return leave.status === LeaveStatus.pending && 
         leave.currentApproverId === currentUserId
}

/**
 * Check if leave request can be cancelled
 */
export function canCancelLeave(leave: LeaveRequest): boolean {
  return leave.status === LeaveStatus.pending || 
         leave.status === LeaveStatus.approved
}

/**
 * Check if leave request can be withdrawn
 */
export function canWithdrawLeave(leave: LeaveRequest): boolean {
  return leave.status === LeaveStatus.pending
}
