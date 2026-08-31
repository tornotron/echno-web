import { describe, expect, test } from 'bun:test';
import {
  employeeReferenceLabel,
  resolveStampName,
  userReferenceLabel,
  userStampLabel,
} from './user-reference';

describe('userStampLabel', () => {
  test('shows the name the backend resolved for the stamp', () => {
    expect(userStampLabel('Anand Rajashekar', 12)).toBe('Anand Rajashekar');
  });

  // An account with no name resolves to its email server-side. That is a real
  // answer and goes on screen as it arrives.
  test('shows an email where the account carries no name', () => {
    expect(userStampLabel('qa-raiser@echno.com', 12)).toBe(
      'qa-raiser@echno.com'
    );
  });

  // A deleted account comes back as the literal string `User #<id>`. It has to
  // stay distinguishable from an unset stamp, which is why it is a string and
  // not a null: "the approver's account is gone" is not "nobody approved this".
  test('shows a deleted account as the reference the server sent', () => {
    expect(userStampLabel('User #34', 34)).toBe('User #34');
  });

  test('an unset stamp shows an em dash, not a user', () => {
    expect(userStampLabel(undefined, undefined)).toBe('—');
    expect(userStampLabel(null, null)).toBe('—');
  });

  // The name and the em dash are the two outcomes a screen must not merge. A
  // stamp that is set always produces something other than the em dash.
  test('a set stamp never renders as an unset one', () => {
    expect(userStampLabel('Aneesh Johny', 3)).not.toBe('—');
    expect(userStampLabel('User #3', 3)).not.toBe('—');
  });

  // Defensive only: a response from a backend that predates the name fields
  // still has to render as something a person can act on.
  test('falls back to the id form when only the id arrives', () => {
    expect(userStampLabel(undefined, 12)).toBe('User #12');
    expect(userStampLabel('', 12)).toBe('User #12');
    expect(userStampLabel('   ', 12)).toBe('User #12');
  });
});

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

describe('employeeReferenceLabel', () => {
  // An employee id that the employee lookup has no row for is an employee, not
  // a user. Wording it `User #<id>` claims it belongs to the user directory,
  // which is the same mislabelling in the opposite direction.
  test('names an unresolved employee id as an employee', () => {
    expect(employeeReferenceLabel(9)).toBe('Employee #9');
    expect(employeeReferenceLabel(9)).not.toContain('User');
  });

  test('an unset field shows nothing', () => {
    expect(employeeReferenceLabel(undefined)).toBe('—');
    expect(employeeReferenceLabel(null)).toBe('—');
    expect(employeeReferenceLabel(0)).toBe('—');
  });
});

describe('resolveStampName', () => {
  const stamps = [
    { id: 12, name: 'Anand Rajashekar' },
    { id: 34, name: 'Aneesh Johny' },
    { id: 56, name: null },
  ];

  test('names an id a loaded row carries', () => {
    expect(resolveStampName(stamps, 34)).toBe('Aneesh Johny');
  });

  test('returns nothing for an id no loaded row carries', () => {
    expect(resolveStampName(stamps, 99)).toBeUndefined();
  });

  test('skips a stamp that carries an id but no name', () => {
    expect(resolveStampName(stamps, 56)).toBeUndefined();
  });

  test('reads through the first blank name to a later resolved one', () => {
    expect(
      resolveStampName(
        [
          { id: 12, name: '' },
          { id: 12, name: 'Anand Rajashekar' },
        ],
        12
      )
    ).toBe('Anand Rajashekar');
  });

  test('an empty list names nothing', () => {
    expect(resolveStampName([], 12)).toBeUndefined();
  });
});
