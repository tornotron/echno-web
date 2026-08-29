import { describe, expect, test } from 'bun:test';
import { JournalEntryStatus } from '@tornotron/echno-core/finance/types';
import type { JournalEntry } from '@tornotron/echno-core/finance/types';
import {
  isValidReversalReason,
  journalEntryReversalGate,
  REVERSAL_REASON_MAX_LENGTH,
} from './reversal-gate';

/**
 * A posted, never-reversed entry with two balanced lines: everything the
 * backend requires before it will reverse, so each test can remove one thing.
 */
function posted(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    entryNumber: 'JE-2026-0042',
    entryDate: '2026-08-01',
    description: 'Opening balance',
    status: JournalEntryStatus.POSTED,
    lines: [
      { id: 'l1', debit: 1000, credit: 0 },
      { id: 'l2', debit: 0, credit: 1000 },
    ],
    ...over,
  } as unknown as JournalEntry;
}

describe('journalEntryReversalGate', () => {
  test('a posted entry may be reversed by someone holding the role', () => {
    const gate = journalEntryReversalGate({
      entry: posted(),
      canReverse: true,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(true);
    expect(gate.reason).toBeUndefined();
  });

  test('a caller without the role is not offered the action at all', () => {
    const gate = journalEntryReversalGate({
      entry: posted(),
      canReverse: false,
    });
    expect(gate.visible).toBe(false);
    expect(gate.enabled).toBe(false);
  });

  test('an already reversed entry is refused with the reason, not hidden', () => {
    const gate = journalEntryReversalGate({
      entry: posted({ status: JournalEntryStatus.REVERSED }),
      canReverse: true,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already been reversed');
  });

  test('an entry carrying a reversal id is spent even while it reads posted', () => {
    const gate = journalEntryReversalGate({
      entry: posted({
        reversedByEntryId: 'a1b2c3d4-0000-4000-8000-000000000002',
      }),
      canReverse: true,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('already been reversed');
  });

  test('a draft entry is refused, naming the status the server would name', () => {
    const gate = journalEntryReversalGate({
      entry: posted({ status: JournalEntryStatus.DRAFT }),
      canReverse: true,
    });
    expect(gate.enabled).toBe(false);
    expect(gate.reason).toContain('Only posted entries can be reversed');
    expect(gate.reason).toContain('draft');
  });

  test('an entry that is itself a reversal can still be reversed', () => {
    // The backend only checks status and the reversal link, so a REVERSAL entry
    // that is POSTED is fair game. Refusing it in the client would be stricter
    // than the server and would strand a wrong reversal.
    const gate = journalEntryReversalGate({
      entry: posted({
        sourceType: 'REVERSAL',
        reversesEntryId: 'a1b2c3d4-0000-4000-8000-000000000003',
      }),
      canReverse: true,
    });
    expect(gate.enabled).toBe(true);
  });
});

describe('isValidReversalReason', () => {
  test('a reason with text passes', () => {
    expect(isValidReversalReason('Posted to the wrong cost centre')).toBe(true);
  });

  test('an empty box fails, because the backend field is NotBlank', () => {
    expect(isValidReversalReason('')).toBe(false);
  });

  test('whitespace only fails the same way', () => {
    expect(isValidReversalReason('   \n  ')).toBe(false);
  });

  test('a reason at the 500 character limit passes', () => {
    expect(isValidReversalReason('x'.repeat(REVERSAL_REASON_MAX_LENGTH))).toBe(
      true
    );
  });

  test('a reason past the limit fails rather than being truncated by the server', () => {
    expect(
      isValidReversalReason('x'.repeat(REVERSAL_REASON_MAX_LENGTH + 1))
    ).toBe(false);
  });
});
