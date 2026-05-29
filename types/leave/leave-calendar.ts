/**
 * types/leave/leave-calendar.ts
 *
 * Domain model for Leave Calendar management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parsePositiveInt } from '@/types/parse-id';
import { HalfDayType, LeaveStatus } from './leave-enums';

/**
 * Leave Calendar Entry interface
 */
export interface LeaveCalendarEntry {
  id: number;
  leaveRequestId: number;
  employeeId: number;
  employeeName?: string;
  department?: string;
  leaveDate: Date | string;
  halfDayType: HalfDayType;
  leaveTypeName?: string;
  status?: LeaveStatus;
  createdAt?: Date;
}

/**
 * Grouped Leave Calendar Entry
 */
export interface GroupedLeaveCalendarEntry {
  date: Date;
  entries: LeaveCalendarEntry[];
  count: number;
}

/**
 * Leave Count Response
 */
export interface LeaveCountResponse {
  date: Date;
  count: number;
}

/**
 * Parse leave calendar entry from JSON
 */
export function parseLeaveCalendarEntry(json: any): LeaveCalendarEntry {
  return {
    id: parsePositiveInt(json.id, 'parseLeaveCalendarEntry.id'),
    leaveRequestId: json.leaveRequestId ?? 0,
    employeeId: json.employeeId ?? 0,
    employeeName: json.employeeName,
    department: json.department,
    leaveDate: json.leaveDate ? new Date(json.leaveDate) : new Date(),
    halfDayType: (json.halfDayType as HalfDayType) ?? HalfDayType.FULL_DAY,
    leaveTypeName: json.leaveTypeName,
    status: json.status as LeaveStatus,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
  };
}

/**
 * Parse grouped leave calendar entry from JSON
 */
export function parseGroupedLeaveCalendarEntry(
  json: any
): GroupedLeaveCalendarEntry {
  return {
    date: json.date ? new Date(json.date) : new Date(),
    entries: json.entries
      ? json.entries.map((e: any) => parseLeaveCalendarEntry(e))
      : [],
    count: json.count ?? 0,
  };
}
