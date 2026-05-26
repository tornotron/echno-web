export interface CreateShiftTimingRequest {
  shiftName: string;
  startTime: string; // HH:MM:SS format
  endTime: string; // HH:MM:SS format
  breakDuration?: number;
  isActive?: boolean;
  maxEmployees?: number;
}

export function createShiftTimingToJson(
  dto: CreateShiftTimingRequest
): Record<string, unknown> {
  return {
    shiftName: dto.shiftName,
    startTime: dto.startTime,
    endTime: dto.endTime,
    breakDuration: dto.breakDuration,
    isActive: dto.isActive,
    maxEmployees: dto.maxEmployees,
  };
}

export interface UpdateShiftTimingRequest {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  isActive?: boolean;
  maxEmployees?: number;
}

export function updateShiftTimingToJson(
  dto: UpdateShiftTimingRequest
): Record<string, unknown> {
  return {
    shiftName: dto.shiftName,
    startTime: dto.startTime,
    endTime: dto.endTime,
    breakDuration: dto.breakDuration,
    isActive: dto.isActive,
    maxEmployees: dto.maxEmployees,
  };
}
