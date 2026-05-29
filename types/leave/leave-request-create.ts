import type { HalfDayType } from './leave-enums';

export interface CreateLeaveRequestRequest {
  employeeId: number;
  leavePolicyId: number;
  startDate: string;
  startHalfDayType?: HalfDayType | null;
  endDate: string;
  endHalfDayType?: HalfDayType | null;
  reason: string;
  contactDuringLeave?: string;
  handoverToId?: number;
  handoverNotes?: string;
  submitImmediately?: boolean;
}

export function createLeaveRequestToJson(
  dto: CreateLeaveRequestRequest
): Record<string, unknown> {
  return {
    employeeId: dto.employeeId,
    leavePolicyId: dto.leavePolicyId,
    startDate: dto.startDate,
    startHalfDayType: dto.startHalfDayType,
    endDate: dto.endDate,
    endHalfDayType: dto.endHalfDayType,
    reason: dto.reason,
    contactDuringLeave: dto.contactDuringLeave,
    handoverToId: dto.handoverToId,
    handoverNotes: dto.handoverNotes,
    submitImmediately: dto.submitImmediately ?? false,
  };
}
