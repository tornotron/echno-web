// types/attendance/clock-event.ts
// Clock event types for attendance tracking

import { parsePositiveInt } from '@/types/parse-id';

export enum ClockEventType {
  morningClockIn = 'morningClockIn',
  lunchBreakStart = 'lunchBreakStart',
  lunchBreakEnd = 'lunchBreakEnd',
  eveningClockOut = 'eveningClockOut',
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
  altitude?: number;
  altitudeAccuracy?: number;
}

export interface ClockEvent {
  id: number;
  eventType: ClockEventType;
  timestamp: Date;
  location: GeoLocation;
  photoUrl: string; // Selfie photo URL
  projectId: number;
  projectName: string;
  deviceInfo?: {
    platform: string; // iOS, Android, Web
    deviceId: string;
    ipAddress?: string;
  };
  isWithinGeofence: boolean; // Whether location is within project geo-fence
  distanceFromProject: number; // Distance in meters from project location
  remarks?: string; // Optional remarks by employee
  verifiedBy?: string; // Admin who verified the attendance
  verifiedAt?: Date;
  isRegularized?: boolean; // If this was regularized later
  regularizationReason?: string;
}

export function getClockEventLabel(eventType: ClockEventType): string {
  const labels: Record<ClockEventType, string> = {
    [ClockEventType.morningClockIn]: 'Morning Clock-In',
    [ClockEventType.lunchBreakStart]: 'Lunch Break Start',
    [ClockEventType.lunchBreakEnd]: 'Lunch Break End',
    [ClockEventType.eveningClockOut]: 'Evening Clock-Out',
  };
  return labels[eventType];
}

export function getClockEventIcon(eventType: ClockEventType): string {
  const icons: Record<ClockEventType, string> = {
    [ClockEventType.morningClockIn]: 'LogIn',
    [ClockEventType.lunchBreakStart]: 'Coffee',
    [ClockEventType.lunchBreakEnd]: 'PlayCircle',
    [ClockEventType.eveningClockOut]: 'LogOut',
  };
  return icons[eventType];
}

/**
 * Calculate distance between two geo-coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  loc1: GeoLocation,
  loc2: GeoLocation
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if location is within geofence radius
 * Default radius is 100 meters
 */
export function isWithinGeofence(
  employeeLocation: GeoLocation,
  projectLocation: GeoLocation,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistance(employeeLocation, projectLocation);
  return distance <= radiusMeters;
}

/**
 * Parse clock event from JSON
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseClockEvent(data: any): ClockEvent {
  return {
    ...data,
    id: parsePositiveInt(data.id, 'parseClockEvent.id'),
    timestamp: new Date(data.timestamp),
    verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
  };
}

/**
 * Convert clock event to JSON
 */
export function clockEventToJson(event: ClockEvent): Record<string, unknown> {
  return {
    ...event,
    timestamp: event.timestamp.toISOString(),
    verifiedAt: event.verifiedAt?.toISOString(),
  };
}
