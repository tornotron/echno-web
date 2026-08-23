import { describe, expect, test } from 'bun:test';

import { compose, optional, required } from './common';
import { noSpaces, startsWith } from './custom';
import { email } from './email';
import { name } from './name';
import { phone } from './phone';
import { url } from './url';
import { username } from './username';

// The validators gate all form input: (value) => error string | null.

describe('email', () => {
  test('accepts a normal address', () => {
    expect(email('user@example.com')).toBeNull();
  });
  test('rejects a missing @, missing domain dot, or whitespace', () => {
    expect(email('userexample.com')).toBe('Invalid email address');
    expect(email('user@example')).toBe('Invalid email address');
    expect(email('user @example.com')).toBe('Invalid email address');
  });
});

describe('phone', () => {
  test('accepts E.164-like numbers with or without a leading +', () => {
    expect(phone('+12345678')).toBeNull();
    expect(phone('12345678')).toBeNull();
  });
  test('rejects too-short numbers, a leading zero, and letters', () => {
    expect(phone('1234567')).toBe('Invalid phone number');
    expect(phone('0123456789')).toBe('Invalid phone number');
    expect(phone('12345abc')).toBe('Invalid phone number');
  });
});

describe('name', () => {
  test('accepts short names and common punctuation', () => {
    expect(name('Al')).toBeNull();
    expect(name("O'Brien-Smith Jr.")).toBeNull();
  });
  test('rejects a single character and digits', () => {
    expect(name('A')).toBe('Name must be at least 2 characters long');
    expect(name('John3')).toBe('Name contains invalid characters');
  });
});

describe('username', () => {
  test('accepts a valid username with allowed characters', () => {
    expect(username('john_doe.1-2')).toBeNull();
  });
  test('enforces the 4-20 length range', () => {
    expect(username('abc')).toBe('Username must be between 4 and 20 characters');
    expect(username('a'.repeat(21))).toBe(
      'Username must be between 4 and 20 characters'
    );
  });
  test('rejects disallowed characters', () => {
    expect(username('has space')).toBe(
      'Username can only contain letters, numbers, dots, underscores, and hyphens'
    );
  });
});

describe('url', () => {
  test('accepts http and https URLs', () => {
    expect(url('https://example.com')).toBeNull();
    expect(url('http://example.com/path')).toBeNull();
  });
  test('rejects non-http protocols and unparseable input', () => {
    expect(url('ftp://example.com')).toBe(
      'Website URL must start with http or https'
    );
    expect(url('not a url')).toBe('Invalid website URL');
  });
});

describe('noSpaces', () => {
  test('fails on any whitespace with the default or a custom message', () => {
    expect(noSpaces()('ab c')).toBe('Spaces are not allowed');
    expect(noSpaces('no spaces please')('a b')).toBe('no spaces please');
    expect(noSpaces()('abc')).toBeNull();
  });
});

describe('startsWith', () => {
  test('enforces the required prefix', () => {
    expect(startsWith('INV-')('INV-001')).toBeNull();
    expect(startsWith('INV-')('001')).toBe('Must start with "INV-"');
  });
});

describe('optional', () => {
  test('treats empty/whitespace as valid but still checks non-empty values', () => {
    expect(optional(email)('')).toBeNull();
    expect(optional(email)('   ')).toBeNull();
    expect(optional(email)('bad')).toBe('Invalid email address');
  });
});

describe('required', () => {
  test('reports a missing value using the field name', () => {
    expect(required('Email')('')).toBe('Email is required');
    expect(required()('   ')).toBe('This field is required');
    expect(required('Email')('present')).toBeNull();
  });
});

describe('compose', () => {
  test('returns the first error, or null when all pass', () => {
    const validate = compose(required('Name'), name);
    expect(validate('')).toBe('Name is required');
    expect(validate('A')).toBe('Name must be at least 2 characters long');
    expect(validate('Alice')).toBeNull();
  });
});
