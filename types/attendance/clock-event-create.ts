import { ClockEventType, type GeoLocation } from './clock-event';

const CLOCK_EVENT_TO_BACKEND: Record<ClockEventType, string> = {
  [ClockEventType.morningClockIn]: 'MORNING_CLOCK_IN',
  [ClockEventType.lunchBreakStart]: 'LUNCH_BREAK_START',
  [ClockEventType.lunchBreakEnd]: 'LUNCH_BREAK_END',
  [ClockEventType.eveningClockOut]: 'EVENING_CLOCK_OUT',
};

/**
 * Frontend representation of a follow-up clock event on an existing
 * attendance record (lunch start/end, evening clock-out).
 *
 * Wire format: JSON-stringified into the `?data=…` query parameter of
 * `POST /attendance/web/clock-event`. Optional selfie travels in the
 * multipart body under the `photo` field.
 */
export interface CreateClockEventRequest {
  attendanceId: number;
  eventType: ClockEventType;
  eventTimestamp: Date;
  location?: GeoLocation;
  photo?: File;
  photoUrl?: string;
  devicePlatform?: string;
  deviceId?: string;
  ipAddress?: string;
  remarks?: string;
}

/** Build the JSON payload sent in the `?data=` query parameter. */
export function createClockEventToJson(
  dto: CreateClockEventRequest
): Record<string, unknown> {
  return {
    attendanceId: dto.attendanceId,
    eventType: CLOCK_EVENT_TO_BACKEND[dto.eventType],
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
