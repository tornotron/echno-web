import type { HalfDayType } from './leave-enums';

export interface CreateLeaveRequestRequest {
  /**
   * Who the request is for. Carried on the call but not in the body:
   * `POST /leave-requests/web` reads the employee from a `@RequestParam`, and
   * its `@PreAuthorize` reads that same parameter, so the query string is the
   * value the authorization check sees. A body copy would be a second value
   * that nothing reads and that can disagree with the one that decides access.
   */
  employeeId: number;
  leavePolicyId: number;
  startDate: string;
  startHalfDayType?: HalfDayType | null;
  endDate: string;
  endHalfDayType?: HalfDayType | null;
  reason: string;
  contactDuringLeave?: string;
  handoverToId?: number;
  handoverNotes?: string;
  submitImmediately?: boolean;
}

/**
 * The request body for `POST /leave-requests/web`.
 *
 * `employeeId` is deliberately absent. It travels on the query string instead,
 * which is where `LeaveRequestControllerWeb.createRequest` and its
 * `@PreAuthorize` both read it from. Spring discards an unread body key
 * silently, so sending it in both places cost nothing today and would have
 * cost a great deal the day the two values differed.
 */
export function createLeaveRequestToJson(
  dto: CreateLeaveRequestRequest
): Record<string, unknown> {
  return {
    leavePolicyId: dto.leavePolicyId,
    startDate: dto.startDate,
    startHalfDayType: dto.startHalfDayType,
    endDate: dto.endDate,
    endHalfDayType: dto.endHalfDayType,
    reason: dto.reason,
    contactDuringLeave: dto.contactDuringLeave,
    handoverToId: dto.handoverToId,
    handoverNotes: dto.handoverNotes,
    submitImmediately: dto.submitImmediately ?? false,
  };
}
