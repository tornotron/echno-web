import { MovementType } from '@/types';

const MOVEMENT_TYPE_TO_BACKEND: Record<MovementType, string> = {
  [MovementType.siteTravel]: 'SITE_TRAVEL',
  [MovementType.clientMeeting]: 'CLIENT_MEETING',
  [MovementType.vendorMeeting]: 'VENDOR_MEETING',
  [MovementType.workFromHome]: 'WORK_FROM_HOME',
  [MovementType.onFieldWork]: 'ON_FIELD_WORK',
  [MovementType.training]: 'TRAINING',
  [MovementType.officeWork]: 'OFFICE_WORK',
  [MovementType.inspection]: 'INSPECTION',
  [MovementType.materialProcurement]: 'MATERIAL_PROCUREMENT',
  [MovementType.supervisoryVisit]: 'SUPERVISORY_VISIT',
  [MovementType.other]: 'OTHER',
};

/**
 * Body of `POST /movement-records/web`. The author identity is sent on the
 * query string as `?employeeId=…`.
 */
export interface CreateMovementRequest {
  attendanceId: number;
  movementType: MovementType;
  fromLocation: string;
  toLocation?: string;
  startTime: Date;
  endTime?: Date;
  purpose: string;
  remarks?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm?: number;
  attachments?: string[];
}

export function createMovementToJson(
  dto: CreateMovementRequest
): Record<string, unknown> {
  return {
    attendanceId: dto.attendanceId,
    movementType: MOVEMENT_TYPE_TO_BACKEND[dto.movementType],
    fromLocation: dto.fromLocation,
    toLocation: dto.toLocation,
    startTime: dto.startTime.toISOString(),
    endTime: dto.endTime?.toISOString(),
    purpose: dto.purpose,
    remarks: dto.remarks,
    startLatitude: dto.startLatitude,
    startLongitude: dto.startLongitude,
    endLatitude: dto.endLatitude,
    endLongitude: dto.endLongitude,
    distanceKm: dto.distanceKm,
    attachments: dto.attachments,
  };
}
