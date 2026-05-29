/**
 * types/leave/leave-policy.ts
 *
 * Domain model for Leave Policy management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parsePositiveInt } from '@/types/parse-id';

/**
 * Leave Policy interface
 */
export interface LeavePolicy {
  id: number;
  organizationId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  description?: string;
  annualQuota: number;
  accrualRatePerMonth: number;
  carryForwardLimit: number;
  carryForwardExpiryMonths?: number;
  minDaysPerRequest: number;
  maxDaysPerRequest?: number;
  advanceNoticeDays: number;
  requiresAttachment: boolean;
  attachmentRequiredAfterDays?: number;
  applicableGenders: string;
  minServiceMonths: number;
  allowHalfDay: boolean;
  isPaid: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Parse leave policy from JSON
 */
export function parseLeavePolicy(json: any): LeavePolicy {
  return {
    id: parsePositiveInt(json.id, 'parseLeavePolicy.id'),
    organizationId: parsePositiveInt(
      json.organizationId,
      'parseLeavePolicy.organizationId'
    ),
    leaveTypeCode: json.leaveTypeCode ?? '',
    leaveTypeName: json.leaveTypeName ?? '',
    description: json.description,
    annualQuota: json.annualQuota ?? 0,
    accrualRatePerMonth: json.accrualRatePerMonth ?? 0,
    carryForwardLimit: json.carryForwardLimit ?? 0,
    carryForwardExpiryMonths: json.carryForwardExpiryMonths,
    minDaysPerRequest: json.minDaysPerRequest ?? 0.5,
    maxDaysPerRequest: json.maxDaysPerRequest,
    advanceNoticeDays: json.advanceNoticeDays ?? 0,
    requiresAttachment: json.requiresAttachment ?? false,
    attachmentRequiredAfterDays: json.attachmentRequiredAfterDays,
    applicableGenders: json.applicableGenders ?? 'ALL',
    minServiceMonths: json.minServiceMonths ?? 0,
    allowHalfDay: json.allowHalfDay ?? true,
    isPaid: json.isPaid ?? true,
    displayOrder: json.displayOrder ?? 0,
    isActive: json.isActive ?? true,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}

export {
  type CreateLeavePolicyRequest,
  createLeavePolicyToJson,
} from './leave-policy-create';
export {
  type UpdateLeavePolicyRequest,
  updateLeavePolicyToJson,
} from './leave-policy-update';
