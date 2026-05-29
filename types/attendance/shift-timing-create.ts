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
    startTime: dto.startTime,
    endTime: dto.endTime,
    lunchBreakStart: dto.lunchBreakStart,
    lunchBreakEnd: dto.lunchBreakEnd,
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
