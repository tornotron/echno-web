/**
 * How a document's `*By` stamp is shown.
 *
 * `submittedBy`, `approvedBy`, `rejectedBy`, `processedBy` and
 * `paymentRecordedBy` are written by the backend from the session, with
 * `UserContextService.getCurrentUserId()`, so they hold a **user** id. Several
 * screens once resolved them through the employee lookup, which is keyed by
 * employee id: two different tables with two different sequences. That lookup
 * misses for most ids, and shows a name belonging to somebody else whenever the
 * two happen to collide, which is worse than showing nothing, because a wrong
 * name on an approval is a wrong record of who approved it.
 *
 * The backend now resolves these stamps itself and sends the name beside the id
 * (`submittedByName`, `approvedByName`, `rejectedByName`, `processedByName`,
 * `paymentRecordedByName`), so the screens read the name off the document
 * rather than guessing. The three outcomes that name can carry are all real and
 * all distinct, and {@link userStampLabel} keeps them apart:
 *
 * - a live account resolves to its name, or to its **email** when it holds no
 *   name;
 * - an account that has since been **deleted** comes back as the literal string
 *   `User #<id>`, which is a resolved answer and not a missing one;
 * - the name is absent **only** when the stamp itself is absent, which is the
 *   document never having been submitted / approved / rejected / processed /
 *   paid.
 *
 * Collapsing the last two would lose the difference between "nobody has
 * approved this" and "the approver's account is gone", which is exactly the
 * distinction an audit trail exists to record.
 *
 * Two stamps still have no name on the wire and keep the id form: a
 * construction payment's `verifiedBy` (a user id the backend does not yet
 * resolve, tracked in echno-backend #621) and the id carried in an
 * `?userId=` filter link, which arrives as a bare number in the URL.
 */

/**
 * Labels a `*By` stamp from the name the backend resolved for it.
 *
 * @param name - The resolved name from the document's matching `*ByName`
 *   field. An empty or absent name is treated as no answer.
 * @param userId - The stamped user id, used only to keep an older response
 *   readable: a backend that predates the name fields sends the id alone.
 * @returns The name where there is one, the id form where there is only an id,
 *   and an em dash where the stamp is unset.
 */
export function userStampLabel(
  name?: string | null,
  userId?: number | null
): string {
  if (typeof name === 'string' && name.trim() !== '') return name;
  return userReferenceLabel(userId);
}

/**
 * Labels the user a document field points at, by id alone.
 *
 * For the two places that have an id and no name: a stamp the backend does not
 * yet resolve, and the id carried in a filter link's query string.
 *
 * @param userId - The stamped user id, if the field is set.
 * @returns The reference to show, or an em dash when the field is unset.
 */
export function userReferenceLabel(userId?: number | null): string {
  if (!userId) return '—';
  return `User #${userId}`;
}

/**
 * Labels an **employee** a document field points at, when the employee lookup
 * has no row for the id.
 *
 * Distinct from {@link userReferenceLabel} because the two ids come from
 * different tables and calling an employee id a user is the same mislabelling
 * the name resolution exists to stop, just in the other direction. A receipt's
 * `issuedBy` and `createdBy` and a stock adjustment's `physicalCountBy` are
 * employee ids taken from the creation payload, so they resolve through the
 * employee lookup and must not be run through the user directory.
 *
 * @param employeeId - The stamped employee id, if the field is set.
 * @returns The reference to show, or an em dash when the field is unset.
 */
export function employeeReferenceLabel(employeeId?: number | null): string {
  if (!employeeId) return '—';
  return `Employee #${employeeId}`;
}

/** One `*By` / `*ByName` pair read off a loaded document. */
export interface UserStamp {
  /** The stamped user id, if set. */
  id?: number | null;
  /** The name the backend resolved for that id, if set. */
  name?: string | null;
}

/**
 * Finds the name for a user id among the stamps a loaded list already carries.
 *
 * A `?userId=` filter link puts only the id in the URL, so the filter chip has
 * a number and no name. The rows the filter selects each carry the same stamp
 * with its resolved name, so the chip can be worded from the list it is
 * filtering rather than from a lookup the client does not have.
 *
 * @param stamps - Every `*By` / `*ByName` pair on the loaded rows.
 * @param userId - The id to name.
 * @returns The resolved name, or undefined when no loaded row carries the id.
 */
export function resolveStampName(
  stamps: readonly UserStamp[],
  userId: number
): string | undefined {
  for (const stamp of stamps) {
    if (
      stamp.id === userId &&
      typeof stamp.name === 'string' &&
      stamp.name.trim() !== ''
    ) {
      return stamp.name;
    }
  }
  return undefined;
}
