/**
 * The browser's rule for "is this reason enough to send" has to be the server's
 * rule.
 *
 * Marking attendance from outside the site boundary is allowed and needs a
 * reason (tornotron/echno-backend#646). The server trims the reason and refuses
 * the punch with a 422 when nothing is left. If the dialog enabled its submit
 * button on anything looser, the employee would type spaces, be told the form
 * was ready, press the button, and be rejected by a server they cannot see.
 */
import { describe, expect, test } from 'bun:test';

import { isGeofenceReasonSatisfied } from './mark-attendance-dialog';

describe('isGeofenceReasonSatisfied', () => {
  test('an empty reason is not enough', () => {
    expect(isGeofenceReasonSatisfied('')).toBe(false);
  });

  test('whitespace is not a reason, which is where the two sides could drift', () => {
    // The server trims before checking. A browser check on length alone would
    // accept these and then be refused.
    expect(isGeofenceReasonSatisfied('   ')).toBe(false);
    expect(isGeofenceReasonSatisfied('\n\t ')).toBe(false);
  });

  test('accepts a real reason', () => {
    expect(
      isGeofenceReasonSatisfied('At head office for the client review')
    ).toBe(true);
  });

  test('accepts a reason that needs trimming but has content', () => {
    expect(isGeofenceReasonSatisfied('  site handover  ')).toBe(true);
  });
});
