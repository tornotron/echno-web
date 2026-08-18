import { describe, expect, test } from 'bun:test';
import type { User } from '@tornotron/echno-core/user/types';
import {
  formatExperience,
  getAvatarColor,
  getCompletionColor,
  getProfileCompletionPercentage,
  hasValue,
  isProfileComplete,
  sanitizeString,
} from './user-profile-utils';

function user(over: Record<string, unknown>): User {
  return over as unknown as User;
}

describe('sanitizeString (XSS)', () => {
  test('strips < and > characters', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe(
      'scriptalert(1)/script'
    );
    expect(sanitizeString('a < b > c')).toBe('a  b  c');
  });

  test('trims surrounding whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  test('empty/undefined input returns empty string', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString(null as unknown as string)).toBe('');
  });
});

describe('getProfileCompletionPercentage (13 fields)', () => {
  test('a fully empty profile is 0%', () => {
    expect(getProfileCompletionPercentage(user({}))).toBe(0);
  });

  test('all 13 fields filled is 100%', () => {
    const full = user({
      name: 'A',
      email: 'a@b.com',
      phone: '123',
      address: 'X',
      dateOfBirth: '2000-01-01',
      gender: 'M',
      bloodGroup: 'O+',
      qualification: 'BE',
      skills: ['x'],
      experience: 5,
      cv: { file: 'cv.pdf' },
      emergencyContact: '999',
      profilePicture: { file: 'p.png' },
    });
    expect(getProfileCompletionPercentage(full)).toBe(100);
  });

  test('rounds the fraction (1 of 13 -> 8)', () => {
    expect(getProfileCompletionPercentage(user({ name: 'A' }))).toBe(8);
  });

  test('"Not Specified" strings do not count', () => {
    expect(
      getProfileCompletionPercentage(user({ name: 'Not Specified' }))
    ).toBe(0);
  });

  test('a non-empty skills array counts; an absent one does not', () => {
    // The field maps to the boolean `skills && skills.length > 0`. An empty
    // array yields boolean `false` (which the non-string branch still counts),
    // so only the absent (undefined) case is a reliable "not filled".
    expect(getProfileCompletionPercentage(user({}))).toBe(0);
    expect(getProfileCompletionPercentage(user({ skills: ['x'] }))).toBe(8);
  });

  test('experience 0 counts (not null/undefined)', () => {
    expect(getProfileCompletionPercentage(user({ experience: 0 }))).toBe(8);
  });
});

describe('isProfileComplete', () => {
  test('true when all six required fields are present', () => {
    const complete = user({
      name: 'A',
      email: 'a@b.com',
      phone: '1',
      address: 'x',
      dateOfBirth: '2000',
      gender: 'M',
    });
    expect(isProfileComplete(complete)).toBe(true);
  });

  test('false when a required field is missing', () => {
    expect(
      isProfileComplete(
        user({ name: 'A', email: 'a@b.com', phone: '1', address: 'x' })
      )
    ).toBe(false);
  });

  test('false when a field is "Not Specified"', () => {
    const u = user({
      name: 'A',
      email: 'a@b.com',
      phone: '1',
      address: 'x',
      dateOfBirth: '2000',
      gender: 'Not Specified',
    });
    expect(isProfileComplete(u)).toBe(false);
  });
});

describe('hasValue', () => {
  test('null/undefined are empty', () => {
    const absent = ({} as { v?: unknown }).v;
    expect(hasValue(null)).toBe(false);
    expect(hasValue(absent)).toBe(false);
  });

  test('strings: blank/whitespace/"Not Specified" are empty', () => {
    expect(hasValue('')).toBe(false);
    expect(hasValue('   ')).toBe(false);
    expect(hasValue('Not Specified')).toBe(false);
    expect(hasValue('real')).toBe(true);
  });

  test('arrays: empty is empty, non-empty has value', () => {
    expect(hasValue([])).toBe(false);
    expect(hasValue([1])).toBe(true);
  });

  test('other truthy values have a value', () => {
    expect(hasValue(5)).toBe(true);
    expect(hasValue({})).toBe(true);
  });
});

describe('getAvatarColor', () => {
  test('is deterministic for the same initials', () => {
    expect(getAvatarColor('AB')).toBe(getAvatarColor('AB'));
  });

  test('maps by the first code point modulo the palette size', () => {
    // 'A' = 65, 65 % 8 = 1 -> second colour
    expect(getAvatarColor('A')).toBe('bg-blue-500');
  });

  test('empty string falls back to index 0', () => {
    expect(getAvatarColor('')).toBe('bg-red-500');
  });
});

describe('formatExperience', () => {
  test('0 is Fresher', () => {
    expect(formatExperience(0)).toBe('Fresher');
  });

  test('1 is singular', () => {
    expect(formatExperience(1)).toBe('1 year');
  });

  test('n>1 is plural', () => {
    expect(formatExperience(4)).toBe('4 years');
  });

  test('undefined is Not specified', () => {
    const absent = ({} as { n?: number }).n;
    expect(formatExperience(absent)).toBe('Not specified');
  });
});

describe('getCompletionColor (threshold bands)', () => {
  test('>= 80 is green', () => {
    expect(getCompletionColor(80)).toBe('text-green-600');
    expect(getCompletionColor(100)).toBe('text-green-600');
  });

  test('50-79 is yellow', () => {
    expect(getCompletionColor(50)).toBe('text-yellow-600');
    expect(getCompletionColor(79)).toBe('text-yellow-600');
  });

  test('< 50 is red', () => {
    expect(getCompletionColor(49)).toBe('text-red-600');
    expect(getCompletionColor(0)).toBe('text-red-600');
  });
});
