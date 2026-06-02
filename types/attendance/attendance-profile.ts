// types/attendance/attendance-profile.ts
// Attendance settings/profile applied to an organization or a specific project.
// Drives validation rules for check-in, clock events, regularization, and
// movement records.

import { parsePositiveInt } from '@/types/parse-id';

export interface AttendanceProfile {
  id: number;
  organizationId?: number;
  settingName: string;
  /** When set, this profile overrides the org default for that project. */
  projectId?: number;
  projectName?: string;
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
  defaultShiftId?: number;
  isActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAttendanceProfile(data: any): AttendanceProfile {
  return {
    id: parsePositiveInt(data.id, 'parseAttendanceProfile.id'),
    settingName: data.settingName,
    projectId: data.projectId ?? undefined,
    projectName: data.projectName ?? undefined,
    checkInOutCycles: data.checkInOutCycles,
    photoRequiredOnCheckIn: data.photoRequiredOnCheckIn,
    photoRequiredOnCheckOut: data.photoRequiredOnCheckOut,
    geolocationRequired: data.geolocationRequired,
    geofenceRadiusMeters: data.geofenceRadiusMeters,
    movementTrackingEnabled: data.movementTrackingEnabled,
    movementPhotoRequired: data.movementPhotoRequired,
    movementGeolocationRequired: data.movementGeolocationRequired,
    autoMarkAbsentAfterHours: data.autoMarkAbsentAfterHours,
    allowSelfRegularization: data.allowSelfRegularization,
    regularizationApprovalRequired: data.regularizationApprovalRequired,
    maxRegularizationDaysPerMonth: data.maxRegularizationDaysPerMonth,
    defaultShiftId: data.defaultShiftId ?? undefined,
    isActive: data.isActive,
  };
}
