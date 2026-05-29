import type { HalfDayType } from './leave-enums';

export interface UpdateLeaveRequestRequest {
  startDate?: string;
  startHalfDayType?: HalfDayType | null;
  endDate?: string;
  endHalfDayType?: HalfDayType | null;
  reason?: string;
  contactDuringLeave?: string;
  handoverToId?: number;
  handoverNotes?: string;
}

export function updateLeaveRequestToJson(
  dto: UpdateLeaveRequestRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {};
  if (dto.startDate !== undefined) json.startDate = dto.startDate;
  if (dto.startHalfDayType !== undefined)
    json.startHalfDayType = dto.startHalfDayType;
  if (dto.endDate !== undefined) json.endDate = dto.endDate;
  if (dto.endHalfDayType !== undefined)
    json.endHalfDayType = dto.endHalfDayType;
  if (dto.reason !== undefined) json.reason = dto.reason;
  if (dto.contactDuringLeave !== undefined)
    json.contactDuringLeave = dto.contactDuringLeave;
  if (dto.handoverToId !== undefined) json.handoverToId = dto.handoverToId;
  if (dto.handoverNotes !== undefined) json.handoverNotes = dto.handoverNotes;
  return json;
}
