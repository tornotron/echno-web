/**
 * features/leave/lib/leave-status-label.ts
 *
 * Display labels for the states a leave request can be in.
 *
 * echno-core spells PENDING_APPROVAL as 'Pending Approval'. On the leave
 * screens the state is always shown on its own — in a badge, a status filter,
 * a chart legend — where the agreed wording is the single word 'Pending', so
 * the displayed label comes from here instead. Only the label changes: the
 * `LeaveStatus` values, the filters keyed on them and the colours all stay as
 * they are, and every status without an entry below keeps the core label.
 */

import {
  LeaveStatus,
  getLeaveStatusLabel,
} from '@tornotron/echno-core/leave/types';

const LABEL_OVERRIDES: Partial<Record<LeaveStatus, string>> = {
  [LeaveStatus.PENDING_APPROVAL]: 'Pending',
};

/** The label to display for a leave request status. */
export function leaveStatusLabel(status: LeaveStatus): string {
  return LABEL_OVERRIDES[status] ?? getLeaveStatusLabel(status);
}
