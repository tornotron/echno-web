export interface CreateAttendanceProfileRequest {
  settingName: string;
  projectId?: number;
  checkInOutCycles: number;
  photoRequiredOnCheckIn: boolean;
  photoRequiredOnCheckOut: boolean;
  geolocationRequired: boolean;
  geofenceRadiusMeters: number;
  movementTrackingEnabled: boolean;
  movementPhotoRequired: boolean;
  movementGeolocationRequired: boolean;
  autoMarkAbsentAfterHours: number;
  allowSelfRegularization: boolean;
  regularizationApprovalRequired: boolean;
  maxRegularizationDaysPerMonth: number;
  /** Frontend domain name; mapped to backend `defaultShiftTimingId`. */
  defaultShiftId?: number;
}

export function createAttendanceProfileToJson(
  dto: CreateAttendanceProfileRequest
): Record<string, unknown> {
  return {
    settingName: dto.settingName,
    projectId: dto.projectId ?? null,
    checkInOutCycles: dto.checkInOutCycles,
    photoRequiredOnCheckIn: dto.photoRequiredOnCheckIn,
    photoRequiredOnCheckOut: dto.photoRequiredOnCheckOut,
    geolocationRequired: dto.geolocationRequired,
    geofenceRadiusMeters: dto.geofenceRadiusMeters,
    movementTrackingEnabled: dto.movementTrackingEnabled,
    movementPhotoRequired: dto.movementPhotoRequired,
    movementGeolocationRequired: dto.movementGeolocationRequired,
    autoMarkAbsentAfterHours: dto.autoMarkAbsentAfterHours,
    allowSelfRegularization: dto.allowSelfRegularization,
    regularizationApprovalRequired: dto.regularizationApprovalRequired,
    maxRegularizationDaysPerMonth: dto.maxRegularizationDaysPerMonth,
    defaultShiftTimingId: dto.defaultShiftId ?? null,
  };
}
