/**
 * types/leave/leave-notification.ts
 *
 * Domain model for Leave Notifications.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LeaveNotificationType } from './leave-enums';

/**
 * Leave Notification interface
 */
export interface LeaveNotification {
  id: number;
  employeeId: number;
  type: LeaveNotificationType;
  title: string;
  message: string;
  leaveRequestId?: number;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

/**
 * Parse leave notification from JSON
 */
export function parseLeaveNotification(json: any): LeaveNotification {
  return {
    id: json.id ?? 0,
    employeeId: json.employeeId ?? 0,
    type:
      (json.type as LeaveNotificationType) ??
      LeaveNotificationType.LEAVE_REMINDER,
    title: json.title ?? '',
    message: json.message ?? '',
    leaveRequestId: json.leaveRequestId,
    isRead: json.isRead ?? false,
    createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
    readAt: json.readAt ? new Date(json.readAt) : undefined,
  };
}
