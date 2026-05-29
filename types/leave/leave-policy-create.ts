export interface CreateLeavePolicyRequest {
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

export function createLeavePolicyToJson(
  dto: CreateLeavePolicyRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    organizationId: dto.organizationId,
    leaveTypeCode: dto.leaveTypeCode,
    leaveTypeName: dto.leaveTypeName,
    annualQuota: dto.annualQuota,
  };
  if (dto.description !== undefined) json.description = dto.description;
  if (dto.accrualRatePerMonth !== undefined)
    json.accrualRatePerMonth = dto.accrualRatePerMonth;
  if (dto.carryForwardLimit !== undefined)
    json.carryForwardLimit = dto.carryForwardLimit;
  if (dto.carryForwardExpiryMonths !== undefined)
    json.carryForwardExpiryMonths = dto.carryForwardExpiryMonths;
  if (dto.minDaysPerRequest !== undefined)
    json.minDaysPerRequest = dto.minDaysPerRequest;
  if (dto.maxDaysPerRequest !== undefined)
    json.maxDaysPerRequest = dto.maxDaysPerRequest;
  if (dto.advanceNoticeDays !== undefined)
    json.advanceNoticeDays = dto.advanceNoticeDays;
  if (dto.requiresAttachment !== undefined)
    json.requiresAttachment = dto.requiresAttachment;
  if (dto.attachmentRequiredAfterDays !== undefined)
    json.attachmentRequiredAfterDays = dto.attachmentRequiredAfterDays;
  if (dto.applicableGenders !== undefined)
    json.applicableGenders = dto.applicableGenders;
  if (dto.minServiceMonths !== undefined)
    json.minServiceMonths = dto.minServiceMonths;
  if (dto.allowHalfDay !== undefined) json.allowHalfDay = dto.allowHalfDay;
  if (dto.isPaid !== undefined) json.isPaid = dto.isPaid;
  if (dto.displayOrder !== undefined) json.displayOrder = dto.displayOrder;
  return json;
}
