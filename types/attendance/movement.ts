// types/attendance/movement.ts
// MovementRecord entity + parser + daily aggregation type. The MovementType
// enum and label/color/icon helpers live in ./movement-type.ts.

import { parsePositiveInt } from '@/types/parse-id';
import type { MovementType } from '@/types';

export interface MovementRecord {
  id: number;
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  movementType: MovementType;
  fromLocation: string;
  toLocation?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  /** Distance in kilometres. */
  distance?: number;
  purpose: string;
  remarks?: string;

  // GPS tracking (optional)
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;

  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  isVerified: boolean;

  /** URLs to attachments (photos, receipts, etc.). */
  attachments?: string[];

  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMovementRecord(data: any): MovementRecord {
  return {
    ...data,
    id: parsePositiveInt(data.id, 'parseMovementRecord.id'),
    startTime: new Date(data.startTime),
    endTime: data.endTime ? new Date(data.endTime) : undefined,
    verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export interface DailyMovementSummary {
  employeeId: number;
  date: Date;
  totalMovements: number;
  /** Total travel time, in minutes. */
  totalTravelTime: number;
  /** Total distance covered, in kilometres. */
  totalDistance: number;
  movements: MovementRecord[];
  primaryActivity: MovementType;
}
