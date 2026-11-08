/**
 * What each invitation stage says and offers. Resending a pending invitation
 * keeps its expiry; resending an expired one renews it with a new expiry, so
 * the note beside the button says which will happen.
 */
import { describe, expect, test } from 'bun:test';
import {
  countByStage,
  resendExpiryNote,
  resendLabel,
} from './invitation-stage';

const day = (date: Date) => date.toISOString().slice(0, 10);
const expiry = new Date('2026-11-15T10:00:00Z');

describe('resendExpiryNote', () => {
  test('a pending invitation keeps its expiry', () => {
    expect(
      resendExpiryNote({ status: 'PENDING', expiresAt: expiry }, day)
    ).toBe('Expires 2026-11-15. A resend keeps this expiry.');
  });

  test('an expired invitation gets a new expiry', () => {
    expect(
      resendExpiryNote({ status: 'EXPIRED', expiresAt: expiry }, day)
    ).toBe('Expired 2026-11-15. A resend sets a new expiry.');
  });

  test('says so even when the expiry is missing', () => {
    expect(resendExpiryNote({ status: 'EXPIRED' }, day)).toBe(
      'Expired. A resend sets a new expiry.'
    );
    expect(resendExpiryNote({ status: 'PENDING' }, day)).toBe(
      'A resend keeps the current expiry.'
    );
  });
});

describe('resendLabel', () => {
  test('an expired invitation is renewed, a pending one resent', () => {
    expect(resendLabel('EXPIRED')).toBe('Renew and resend');
    expect(resendLabel('PENDING')).toBe('Resend');
  });
});

describe('countByStage', () => {
  test('counts every stage, unknown included', () => {
    const counts = countByStage([
      { status: 'PENDING' },
      { status: 'PENDING' },
      { status: 'ACCEPTED_BY_ANOTHER_ADDRESS' },
      { status: 'UNKNOWN' },
    ]);
    expect(counts.PENDING).toBe(2);
    expect(counts.ACCEPTED_BY_ANOTHER_ADDRESS).toBe(1);
    expect(counts.UNKNOWN).toBe(1);
    expect(counts.REVOKED).toBe(0);
  });
});
