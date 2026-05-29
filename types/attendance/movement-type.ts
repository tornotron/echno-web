// types/attendance/movement-type.ts
// Movement and activity types for tracking employee movements

import { parsePositiveInt } from '@/types/parse-id';

export enum MovementType {
  siteTravel = 'siteTravel',
  clientMeeting = 'clientMeeting',
  vendorMeeting = 'vendorMeeting',
  workFromHome = 'workFromHome',
  onFieldWork = 'onFieldWork',
  training = 'training',
  officeWork = 'officeWork',
  inspection = 'inspection',
  materialProcurement = 'materialProcurement',
  supervisoryVisit = 'supervisoryVisit',
  other = 'other',
}

export function getMovementTypeLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    [MovementType.siteTravel]: 'Site Travel',
    [MovementType.clientMeeting]: 'Client Meeting',
    [MovementType.vendorMeeting]: 'Vendor Meeting',
    [MovementType.workFromHome]: 'Work From Home',
    [MovementType.onFieldWork]: 'On Field Work',
    [MovementType.training]: 'Training',
    [MovementType.officeWork]: 'Office Work',
    [MovementType.inspection]: 'Site Inspection',
    [MovementType.materialProcurement]: 'Material Procurement',
    [MovementType.supervisoryVisit]: 'Supervisory Visit',
    [MovementType.other]: 'Other',
  };
  return labels[type];
}

export function getMovementTypeColor(type: MovementType): string {
  const colors: Record<MovementType, string> = {
    [MovementType.siteTravel]:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    [MovementType.clientMeeting]:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    [MovementType.vendorMeeting]:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
    [MovementType.workFromHome]:
      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    [MovementType.onFieldWork]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    [MovementType.training]:
      'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
    [MovementType.officeWork]:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    [MovementType.inspection]:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    [MovementType.materialProcurement]:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
    [MovementType.supervisoryVisit]:
      'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
    [MovementType.other]:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return colors[type];
}

export function getMovementTypeIcon(type: MovementType): string {
  const icons: Record<MovementType, string> = {
    [MovementType.siteTravel]: 'Car',
    [MovementType.clientMeeting]: 'Users',
    [MovementType.vendorMeeting]: 'Package',
    [MovementType.workFromHome]: 'Home',
    [MovementType.onFieldWork]: 'MapPin',
    [MovementType.training]: 'GraduationCap',
    [MovementType.officeWork]: 'Building',
    [MovementType.inspection]: 'ClipboardCheck',
    [MovementType.materialProcurement]: 'ShoppingCart',
    [MovementType.supervisoryVisit]: 'Eye',
    [MovementType.other]: 'MoreHorizontal',
  };
  return icons[type];
}

export interface MovementRecord {
  id: number;
  attendanceId: number;
  employeeId: string;
  employeeName: string;
  movementType: MovementType;
  fromLocation: string;
  toLocation?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  distance?: number; // in kilometers
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

  // Attachments (photos, receipts, etc.)
  attachments?: string[]; // URLs to attachments

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
  employeeId: string;
  date: Date;
  totalMovements: number;
  totalTravelTime: number; // in minutes
  totalDistance: number; // in kilometers
  movements: MovementRecord[];
  primaryActivity: MovementType;
}
