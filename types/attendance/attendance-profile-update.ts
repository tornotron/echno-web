export interface UpdateAttendanceProfileRequest {
  settingName?: string;
  projectId?: number;
  checkInOutCycles?: number;
  photoRequiredOnCheckIn?: boolean;
  photoRequiredOnCheckOut?: boolean;
  geolocationRequired?: boolean;
  geofenceRadiusMeters?: number;
  movementTrackingEnabled?: boolean;
  movementPhotoRequired?: boolean;
  movementGeolocationRequired?: boolean;
  autoMarkAbsentAfterHours?: number;
  allowSelfRegularization?: boolean;
  regularizationApprovalRequired?: boolean;
  maxRegularizationDaysPerMonth?: number;
  defaultShiftId?: number;
  isActive?: boolean;
}

export function updateAttendanceProfileToJson(
  dto: UpdateAttendanceProfileRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {};
  if (dto.settingName !== undefined) json.settingName = dto.settingName;
  if (dto.projectId !== undefined) json.projectId = dto.projectId;
  if (dto.checkInOutCycles !== undefined)
    json.checkInOutCycles = dto.checkInOutCycles;
  if (dto.photoRequiredOnCheckIn !== undefined)
    json.photoRequiredOnCheckIn = dto.photoRequiredOnCheckIn;
  if (dto.photoRequiredOnCheckOut !== undefined)
    json.photoRequiredOnCheckOut = dto.photoRequiredOnCheckOut;
  if (dto.geolocationRequired !== undefined)
    json.geolocationRequired = dto.geolocationRequired;
  if (dto.geofenceRadiusMeters !== undefined)
    json.geofenceRadiusMeters = dto.geofenceRadiusMeters;
  if (dto.movementTrackingEnabled !== undefined)
    json.movementTrackingEnabled = dto.movementTrackingEnabled;
  if (dto.movementPhotoRequired !== undefined)
    json.movementPhotoRequired = dto.movementPhotoRequired;
  if (dto.movementGeolocationRequired !== undefined)
    json.movementGeolocationRequired = dto.movementGeolocationRequired;
  if (dto.autoMarkAbsentAfterHours !== undefined)
    json.autoMarkAbsentAfterHours = dto.autoMarkAbsentAfterHours;
  if (dto.allowSelfRegularization !== undefined)
    json.allowSelfRegularization = dto.allowSelfRegularization;
  if (dto.regularizationApprovalRequired !== undefined)
    json.regularizationApprovalRequired = dto.regularizationApprovalRequired;
  if (dto.maxRegularizationDaysPerMonth !== undefined)
    json.maxRegularizationDaysPerMonth = dto.maxRegularizationDaysPerMonth;
  if (dto.defaultShiftId !== undefined)
    json.defaultShiftId = dto.defaultShiftId;
  if (dto.isActive !== undefined) json.isActive = dto.isActive;
  return json;
}
