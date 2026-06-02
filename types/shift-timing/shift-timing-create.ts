/** Append ":00" so "09:00" → "09:00:00" as required by backend LocalTime. */
function toBackendTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

export interface CreateShiftTimingRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  gracePeriodMinutes?: number;
  minimumWorkHours?: number;
  halfDayWorkHours?: number;
  overtimeThreshold?: number;
}

export function createShiftTimingToJson(
  dto: CreateShiftTimingRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    shiftName: dto.shiftName,
    startTime: toBackendTime(dto.startTime),
    endTime: toBackendTime(dto.endTime),
    lunchBreakStart: toBackendTime(dto.lunchBreakStart),
    lunchBreakEnd: toBackendTime(dto.lunchBreakEnd),
  };
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
