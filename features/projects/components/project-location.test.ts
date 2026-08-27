import { describe, expect, test } from 'bun:test';

import {
  ADDRESS_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
  coordinateError,
} from './project-form';
import { INDIAN_STATES } from '../constants/indian-states';
import { optionalOnCreate, optionalOnUpdate } from '../lib/location-fields';

describe('coordinateError', () => {
  test('accepts a blank box, because coordinates are optional', () => {
    // The API required them while the form called them optional, so a project
    // described by address alone could not be created. Both sides agree now,
    // and this is the rule that has to keep them agreeing.
    expect(coordinateError('', 'Latitude', 90)).toBeNull();
    expect(coordinateError('   ', 'Longitude', 180)).toBeNull();
  });

  test('accepts a value inside the range, including the bounds and zero', () => {
    expect(coordinateError('13.0827', 'Latitude', 90)).toBeNull();
    expect(coordinateError('0', 'Latitude', 90)).toBeNull();
    expect(coordinateError('-90', 'Latitude', 90)).toBeNull();
    expect(coordinateError('180', 'Longitude', 180)).toBeNull();
  });

  test('rejects a value outside the range', () => {
    expect(coordinateError('120', 'Latitude', 90)).toBe(
      'Latitude must be between -90 and 90'
    );
    expect(coordinateError('-181', 'Longitude', 180)).toBe(
      'Longitude must be between -180 and 180'
    );
  });

  test('rejects something that is not a number', () => {
    expect(coordinateError('north', 'Latitude', 90)).toBe(
      'Latitude must be a number'
    );
  });
});

describe('field limits', () => {
  test('match what the API accepts', () => {
    // The address cap was 50 on the API, which had no room for a street, a
    // city and a state on one line. If the API cap moves again, this is the
    // line that should fail first.
    expect(ADDRESS_MAX_LENGTH).toBe(255);
    expect(POSTAL_CODE_MAX_LENGTH).toBe(16);
  });
});

describe('INDIAN_STATES', () => {
  test('covers the 28 states and 8 union territories', () => {
    expect(INDIAN_STATES).toHaveLength(36);
  });

  test('uses the canonical spellings the API will accept', () => {
    // The API rejects anything that is not an exact state name, so a typo here
    // would be a save that fails with a 400 and no way for the user to fix it.
    expect(INDIAN_STATES).toContain('Tamil Nadu');
    expect(INDIAN_STATES).toContain('Delhi');
    expect(INDIAN_STATES).toContain('Dadra and Nagar Haveli and Daman and Diu');
    expect(INDIAN_STATES).not.toContain('Tamilnadu');
  });

  test('has no duplicates and nothing blank', () => {
    expect(new Set(INDIAN_STATES).size).toBe(INDIAN_STATES.length);
    expect(INDIAN_STATES.every((s) => s.trim() === s && s.length > 0)).toBe(
      true
    );
  });
});

describe('optional location fields on the wire', () => {
  test('create leaves a blank field out entirely', () => {
    // A missing key already means "not recorded" on create.
    expect(optionalOnCreate('')).toBeUndefined();
    expect(optionalOnCreate('   ')).toBeUndefined();
  });

  test('edit sends a cleared field as an empty string, never undefined', () => {
    // This is the whole point. The core update serializer emits a key only
    // when the value is not undefined, and the API reads a missing key on a
    // patch as "leave unchanged". Returning undefined here would make a saved
    // city, state or PIN code impossible to remove.
    expect(optionalOnUpdate('')).toBe('');
    expect(optionalOnUpdate('   ')).toBe('');
    expect(optionalOnUpdate('')).not.toBeUndefined();
  });

  test('both trim a value that is present', () => {
    expect(optionalOnCreate('  Chennai  ')).toBe('Chennai');
    expect(optionalOnUpdate('  600004  ')).toBe('600004');
  });
});
