import { describe, expect, test } from 'bun:test';
import { password } from './password';

// First web unit suite. Pure validator: (value) => error string | null.
describe('password validator', () => {
  test('accepts a strong password', () => {
    expect(password('Str0ng!Pass')).toBeNull();
  });

  test('rejects a password shorter than 8 characters', () => {
    expect(password('A1!a')).toBe('Password must be at least 8 characters long');
  });

  test('requires an uppercase letter', () => {
    expect(password('lowercase1!')).toBe(
      'Password must contain at least one uppercase letter',
    );
  });

  test('requires a lowercase letter', () => {
    expect(password('UPPERCASE1!')).toBe(
      'Password must contain at least one lowercase letter',
    );
  });

  test('requires a number', () => {
    expect(password('NoNumberHere!')).toBe(
      'Password must contain at least one number',
    );
  });

  test('requires a special character', () => {
    expect(password('NoSpecial1')).toBe(
      'Password must contain at least one special character',
    );
  });
});
