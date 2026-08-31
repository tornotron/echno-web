/**
 * types/leave/leave-approval.ts
 *
 * Domain model for Leave Approval management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parsePositiveInt } from '@/types/parse-id';
import { ApprovalAction } from './leave-enums';

/**
 * Leave Approval interface
 */
export interface LeaveApproval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approverName?: string;
  approverDesignation?: string;
  approvalLevel: number;
  action: ApprovalAction;
  comments?: string;
  delegatedFromId?: number;
  delegatedFromName?: string;
  actionAt?: Date;
  createdAt?: Date;
}

/**
 * Leave Approval Action
 *
 * There is deliberately no approver. The backend stamps it from the signed-in
 * session (echno-backend #598) and `LeaveApprovalActionDto` no longer declares
 * an approver field, so nobody can record a decision in a colleague's name.
 * The mutation hooks still take the acting approver as their own variable,
 * because the pending-approvals cache is keyed by it, but it is not sent.
 */
export interface LeaveApprovalAction {
  comments?: string;
  delegateToId?: number;
}

/**
 * Approval Chain Response
 */
export interface ApprovalChainResponse {
  requestId: number;
  approvals: LeaveApproval[];
}

/**
 * Can Approve Response
 */
export interface CanApproveResponse {
  canApprove: boolean;
  reason?: string;
}

/**
 * Parse leave approval from JSON
 */
export function parseLeaveApproval(json: any): LeaveApproval {
  return {
    id: parsePositiveInt(json.id, 'parseLeaveApproval.id'),
    leaveRequestId: parsePositiveInt(
      json.leaveRequestId,
      'parseLeaveApproval.leaveRequestId'
    ),
    approverId: parsePositiveInt(
      json.approverId,
      'parseLeaveApproval.approverId'
    ),
    approverName: json.approverName,
    approverDesignation: json.approverDesignation,
    approvalLevel: json.approvalLevel ?? 0,
    action: (json.action as ApprovalAction) ?? ApprovalAction.PENDING,
    comments: json.comments,
    delegatedFromId: json.delegatedFromId,
    delegatedFromName: json.delegatedFromName,
    actionAt: json.actionAt ? new Date(json.actionAt) : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
  };
}

/**
 * Convert approval action DTO to JSON
 */
export function approvalActionToJson(dto: LeaveApprovalAction): any {
  const json: any = {};

  if (dto.comments !== undefined) json.comments = dto.comments;
  if (dto.delegateToId !== undefined) json.delegateToId = dto.delegateToId;

  return json;
}
