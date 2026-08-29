import { JournalEntryStatus } from '@tornotron/echno-core/finance/types';
import type { JournalEntry } from '@tornotron/echno-core/finance/types';

/** The longest reason the backend will store (`@Size(max = 500)`). */
export const REVERSAL_REASON_MAX_LENGTH = 500;

/**
 * Whether the reverse action is offered on a journal entry, and if not, why.
 *
 * A reversal writes a second entry to the ledger, so the backend refuses it in
 * several ways a client can see coming. Firing the request anyway and showing
 * the 4xx tells the accountant their action failed without telling them what to
 * do instead, so the conditions are evaluated here and the control either does
 * not appear or appears disabled with the reason beside it.
 */
export interface ReversalGate {
  /** Whether the action belongs on the screen at all. */
  visible: boolean;
  /** Whether it can be pressed. */
  enabled: boolean;
  /** Why it cannot be pressed, when it is visible but disabled. */
  reason?: string;
}

interface ReversalGateInput {
  entry: JournalEntry;
  /** Whether the caller holds `system-admin` or a manager-tier role. */
  canReverse: boolean;
}

const HIDDEN: ReversalGate = { visible: false, enabled: false };

function refuse(reason: string): ReversalGate {
  return { visible: true, enabled: false, reason };
}

/**
 * Applies the backend's reversal rules to an entry the client already holds.
 *
 * The order matches `JournalPostingService.reverse`: the status check first,
 * then the already-reversed check, so the reason shown is the one the server
 * would have given.
 *
 * @param input - The entry and whether the caller holds a reversing role.
 * @returns Whether to show the action, whether to enable it, and the reason.
 */
export function journalEntryReversalGate({
  entry,
  canReverse,
}: ReversalGateInput): ReversalGate {
  // Reversal is limited to system-admin and project-manager. Someone who
  // cannot reverse should not be shown a control that only ever 403s.
  if (!canReverse) {
    return HIDDEN;
  }

  // Only a POSTED entry can be reversed. A REVERSED one has already been
  // undone, and the mirror entry is on the ledger beside it, so the action is
  // shown disabled with the reason rather than hidden: the accountant is
  // looking for it, and "already reversed" is the answer they need.
  if (entry.status === JournalEntryStatus.REVERSED) {
    return refuse(
      'This entry has already been reversed. Its reversing entry is on the ' +
        'ledger; reverse that one instead if it also needs undoing.'
    );
  }

  if (entry.status !== JournalEntryStatus.POSTED) {
    return refuse(
      `Only posted entries can be reversed. This one is ${entry.status.toLowerCase()}.`
    );
  }

  // The backend checks the link as well as the status, because the two are set
  // in the same transaction and an entry carrying a reversal id is spent even
  // if its status reads otherwise.
  if (entry.reversedByEntryId) {
    return refuse(
      'This entry has already been reversed. Its reversing entry is on the ' +
        'ledger; reverse that one instead if it also needs undoing.'
    );
  }

  return { visible: true, enabled: true };
}

/**
 * Whether a typed reason satisfies the backend's `@NotBlank @Size(max = 500)`
 * on `ReverseJournalRequest.reason`.
 *
 * The `echno-core` type has the field optional and the client omits it from the
 * body when it is undefined, so an empty box would reach the server as a
 * missing required field and come back 400. The dialog therefore keeps the
 * confirm button disabled until this passes.
 *
 * @param reason - The raw text from the reason box.
 * @returns True when the trimmed reason is non-empty and within 500 characters.
 */
export function isValidReversalReason(reason: string): boolean {
  const trimmed = reason.trim();
  return trimmed.length > 0 && trimmed.length <= REVERSAL_REASON_MAX_LENGTH;
}
