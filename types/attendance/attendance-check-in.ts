import type { GeoLocation } from '@/types';

/**
 * Frontend representation of a check-in submission.
 *
 * Wire format: this DTO is JSON-stringified and sent as the `?data=…` query
 * parameter of `POST /attendance/web/check-in`. The selfie travels in the
 * multipart body under the `photo` field.
 */
export interface AttendanceCheckInRequest {
  employeeId: number;
  projectId: number;
  shiftTimingId: number;
  eventTimestamp: Date;
  location?: GeoLocation;
  /** Selfie captured via front camera; sent as multipart. */
  photo?: File;
  /** Fallback: pre-existing URL (used when no fresh capture is available). */
  photoUrl?: string;
  devicePlatform?: string;
  deviceId?: string;
  ipAddress?: string;
  remarks?: string;
}

/** Build the JSON payload sent in the `?data=` query parameter. */
export function attendanceCheckInToJson(
  dto: AttendanceCheckInRequest
): Record<string, unknown> {
  return {
    employeeId: dto.employeeId,
    projectId: dto.projectId,
    shiftTimingId: dto.shiftTimingId,
    eventTimestamp: dto.eventTimestamp.toISOString(),
    latitude: dto.location?.latitude,
    longitude: dto.location?.longitude,
    gpsAccuracy: dto.location?.accuracy,
    altitude: dto.location?.altitude,
    photoUrl: dto.photoUrl,
    devicePlatform: dto.devicePlatform,
    deviceId: dto.deviceId,
    ipAddress: dto.ipAddress,
    remarks: dto.remarks,
  };
}
