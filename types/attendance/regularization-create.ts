import { ClockEventType, type GeoLocation } from './clock-event';

const CLOCK_EVENT_TO_BACKEND: Record<ClockEventType, string> = {
  [ClockEventType.morningClockIn]: 'MORNING_CLOCK_IN',
  [ClockEventType.lunchBreakStart]: 'LUNCH_BREAK_START',
  [ClockEventType.lunchBreakEnd]: 'LUNCH_BREAK_END',
  [ClockEventType.eveningClockOut]: 'EVENING_CLOCK_OUT',
};

/**
 * Single corrected event included with a regularization request.
 *
 * `projectId` is required by the backend's `ClockEventCreationDto`; callers
 * must always pass the parent attendance's projectId here.
 */
export interface CorrectedClockEvent {
  eventType: ClockEventType;
  eventTimestamp: Date;
  projectId: number;
  location?: GeoLocation;
  photoUrl?: string;
}

/**
 * Body of `POST /attendance-regularizations/web/request`. The author identity
 * is passed separately as the `?requestedBy=…` query parameter.
 */
export interface CreateRegularizationRequest {
  attendanceId: number;
  reason: string;
  missingEvents: ClockEventType[];
  correctedEvents?: CorrectedClockEvent[];
}

export function createRegularizationToJson(
  dto: CreateRegularizationRequest
): Record<string, unknown> {
  return {
    attendanceId: dto.attendanceId,
    reason: dto.reason,
    missingEvents: dto.missingEvents.map((e) => CLOCK_EVENT_TO_BACKEND[e]),
    correctedEvents: dto.correctedEvents?.map((ce) => ({
      eventType: CLOCK_EVENT_TO_BACKEND[ce.eventType],
      eventTimestamp: ce.eventTimestamp.toISOString(),
      projectId: ce.projectId,
      latitude: ce.location?.latitude,
      longitude: ce.location?.longitude,
      photoUrl: ce.photoUrl,
    })),
  };
}
