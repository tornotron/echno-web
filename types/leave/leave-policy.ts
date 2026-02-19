/**
 * types/leave/leave-policy.ts
 *
 * Domain model for Leave Policy management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

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
 * Leave Policy Creation
 */
export interface LeavePolicyCreation {
  organizationId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  description?: string;
  annualQuota: number;
  accrualRatePerMonth?: number;
  carryForwardLimit?: number;
  carryForwardExpiryMonths?: number;
  minDaysPerRequest?: number;
  maxDaysPerRequest?: number;
  advanceNoticeDays?: number;
  requiresAttachment?: boolean;
  attachmentRequiredAfterDays?: number;
  applicableGenders?: string;
  minServiceMonths?: number;
  allowHalfDay?: boolean;
  isPaid?: boolean;
  displayOrder?: number;
}

/**
 * Parse leave policy from JSON
 */
export function parseLeavePolicy(json: any): LeavePolicy {
  return {
    id: json.id ?? 0,
    organizationId: json.organizationId ?? 0,
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

/**
 * Convert leave policy to JSON
 */
export function leavePolicyToJson(policy: Partial<LeavePolicy>): any {
  const json: any = {};

  if (policy.organizationId !== undefined)
    json.organizationId = policy.organizationId;
  if (policy.leaveTypeCode) json.leaveTypeCode = policy.leaveTypeCode;
  if (policy.leaveTypeName) json.leaveTypeName = policy.leaveTypeName;
  if (policy.description !== undefined) json.description = policy.description;
  if (policy.annualQuota !== undefined) json.annualQuota = policy.annualQuota;
  if (policy.accrualRatePerMonth !== undefined)
    json.accrualRatePerMonth = policy.accrualRatePerMonth;
  if (policy.carryForwardLimit !== undefined)
    json.carryForwardLimit = policy.carryForwardLimit;
  if (policy.carryForwardExpiryMonths !== undefined)
    json.carryForwardExpiryMonths = policy.carryForwardExpiryMonths;
  if (policy.minDaysPerRequest !== undefined)
    json.minDaysPerRequest = policy.minDaysPerRequest;
  if (policy.maxDaysPerRequest !== undefined)
    json.maxDaysPerRequest = policy.maxDaysPerRequest;
  if (policy.advanceNoticeDays !== undefined)
    json.advanceNoticeDays = policy.advanceNoticeDays;
  if (policy.requiresAttachment !== undefined)
    json.requiresAttachment = policy.requiresAttachment;
  if (policy.attachmentRequiredAfterDays !== undefined)
    json.attachmentRequiredAfterDays = policy.attachmentRequiredAfterDays;
  if (policy.applicableGenders !== undefined)
    json.applicableGenders = policy.applicableGenders;
  if (policy.minServiceMonths !== undefined)
    json.minServiceMonths = policy.minServiceMonths;
  if (policy.allowHalfDay !== undefined)
    json.allowHalfDay = policy.allowHalfDay;
  if (policy.isPaid !== undefined) json.isPaid = policy.isPaid;
  if (policy.displayOrder !== undefined)
    json.displayOrder = policy.displayOrder;

  return json;
}
