/**
 * How a document's `*By` stamp is shown.
 *
 * `submittedBy`, `approvedBy`, `rejectedBy` and `paymentRecordedBy` are written
 * by the backend from the session, with `UserContextService.getCurrentUserId()`,
 * so they hold a **user** id. Several screens resolved them through the
 * employee lookup, which is keyed by employee id: two different tables with two
 * different sequences. That lookup misses for most ids, and shows a name
 * belonging to somebody else whenever the two happen to collide, which is worse
 * than showing nothing, because a wrong name on an approval is a wrong record
 * of who approved it.
 *
 * Nothing in the API resolves a user id to a name: `userService` reads only the
 * caller's own user, and neither `Employee` nor `EmployeeLookup` carries the
 * user id that would join the two. Until the backend carries a display name on
 * these DTOs, the id is shown as an id. The employee filter chip already words
 * it this way when its own lookup misses, so the two agree.
 */

/**
 * Labels the user a document field points at.
 *
 * @param userId - The stamped user id, if the field is set.
 * @returns The reference to show, or an em dash when the field is unset.
 */
export function userReferenceLabel(userId?: number | null): string {
  if (!userId) return '—';
  return `User #${userId}`;
}
