import { describe, expect, test } from 'bun:test';
import { userReferenceLabel } from './user-reference';

describe('userReferenceLabel', () => {
  test('names the user id it was given', () => {
    expect(userReferenceLabel(12)).toBe('User #12');
  });

  test('an unset field shows nothing rather than a user', () => {
    expect(userReferenceLabel(undefined)).toBe('—');
    expect(userReferenceLabel(null)).toBe('—');
    expect(userReferenceLabel(0)).toBe('—');
  });

  test('it does not dress a user id as an employee code', () => {
    // The screens this replaces rendered `EMP-012` for a user id, which reads
    // as an employee code and belongs to whichever employee happens to hold
    // that number. The point of the change is that the label no longer claims
    // to be an employee at all.
    expect(userReferenceLabel(12)).not.toContain('EMP');
  });
});
