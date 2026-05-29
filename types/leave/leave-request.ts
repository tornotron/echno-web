/**
 * types/leave/leave-request.ts
 *
 * Domain model for Leave Request management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parsePositiveInt } from '@/types/parse-id';
import { LeaveStatus, HalfDayType } from './leave-enums';
import { LeaveApproval, parseLeaveApproval } from './leave-approval';

/**
 * Leave Request interface
 */
export interface LeaveRequest {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName?: string;
  department?: string;
  organizationId?: number;
  leavePolicyId: number;
  leaveTypeName?: string;
  startDate: Date;
  startHalfDayType?: HalfDayType;
  endDate: Date;
  endHalfDayType?: HalfDayType;
  totalDays: number;
  reason: string;
  contactDuringLeave?: string;
  handoverToId?: number;
  handoverToName?: string;
  handoverNotes?: string;
  status: LeaveStatus;
  currentApproverId?: number;
  currentApproverName?: string;
  currentApprovalLevel?: number;
  maxApprovalLevel?: number;
  cancellationReason?: string;
  approvals?: LeaveApproval[];
  createdAt?: Date;
  updatedAt?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  withdrawnAt?: Date;
}

/**
 * Calculate Days Request
 */
export interface CalculateDays {
  startDate: string;
  startHalfDayType?: HalfDayType | null;
  endDate: string;
  endHalfDayType?: HalfDayType | null;
}

/**
 * Calculate Days Response
 */
export interface CalculateDaysResponse {
  totalDays: number;
}

/**
 * Conflict Check Response
 */
export interface ConflictCheckResponse {
  hasConflict: boolean;
  conflictingRequests: LeaveRequest[];
}

/**
 * Parse leave request from JSON
 */
export function parseLeaveRequest(json: any): LeaveRequest {
  return {
    id: parsePositiveInt(json.id, 'parseLeaveRequest.id'),
    requestNumber: json.requestNumber ?? '',
    employeeId: json.employeeId ?? 0,
    employeeName: json.employeeName,
    department: json.department,
    organizationId: json.organizationId,
    leavePolicyId: parsePositiveInt(
      json.leavePolicyId ?? json.leavePolicy?.id,
      'parseLeaveRequest.leavePolicyId'
    ),
    leaveTypeName: json.leaveTypeName ?? json.leavePolicy?.leaveTypeName,
    startDate: json.startDate ? new Date(json.startDate) : new Date(),
    startHalfDayType: json.startHalfDayType as HalfDayType,
    endDate: json.endDate ? new Date(json.endDate) : new Date(),
    endHalfDayType: json.endHalfDayType as HalfDayType,
    totalDays: json.totalDays ?? 0,
    reason: json.reason ?? '',
    contactDuringLeave: json.contactDuringLeave,
    handoverToId: json.handoverToId,
    handoverToName: json.handoverToName ?? json.handoverTo?.name,
    handoverNotes: json.handoverNotes,
    status: (json.status as LeaveStatus) ?? LeaveStatus.DRAFT,
    currentApproverId: json.currentApproverId,
    currentApproverName: json.currentApproverName,
    currentApprovalLevel: json.currentApprovalLevel,
    maxApprovalLevel: json.maxApprovalLevel,
    cancellationReason: json.cancellationReason,
    approvals: json.approvals
      ? json.approvals.map((approval: any) => parseLeaveApproval(approval))
      : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
    submittedAt: json.submittedAt ? new Date(json.submittedAt) : undefined,
    approvedAt: json.approvedAt ? new Date(json.approvedAt) : undefined,
    rejectedAt: json.rejectedAt ? new Date(json.rejectedAt) : undefined,
    cancelledAt: json.cancelledAt ? new Date(json.cancelledAt) : undefined,
    withdrawnAt: json.withdrawnAt ? new Date(json.withdrawnAt) : undefined,
  };
}

export {
  type CreateLeaveRequestRequest,
  createLeaveRequestToJson,
} from './leave-request-create';
export {
  type UpdateLeaveRequestRequest,
  updateLeaveRequestToJson,
} from './leave-request-update';
