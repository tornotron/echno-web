export interface UpdateShiftTimingRequest {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  gracePeriodMinutes?: number;
  minimumWorkHours?: number;
  halfDayWorkHours?: number;
  overtimeThreshold?: number;
}

export function updateShiftTimingToJson(
  dto: UpdateShiftTimingRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {};
  if (dto.shiftName !== undefined) json.shiftName = dto.shiftName;
  if (dto.startTime !== undefined) json.startTime = dto.startTime;
  if (dto.endTime !== undefined) json.endTime = dto.endTime;
  if (dto.lunchBreakStart !== undefined)
    json.lunchBreakStart = dto.lunchBreakStart;
  if (dto.lunchBreakEnd !== undefined) json.lunchBreakEnd = dto.lunchBreakEnd;
  if (dto.gracePeriodMinutes !== undefined)
    json.gracePeriodMinutes = dto.gracePeriodMinutes;
  if (dto.minimumWorkHours !== undefined)
    json.minimumWorkHours = dto.minimumWorkHours;
  if (dto.halfDayWorkHours !== undefined)
    json.halfDayWorkHours = dto.halfDayWorkHours;
  if (dto.overtimeThreshold !== undefined)
    json.overtimeThreshold = dto.overtimeThreshold;
  return json;
}
