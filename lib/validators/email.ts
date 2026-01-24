import { Validator } from './common';

/**
 * email
 *
 * Simple, fast email format validator. It uses a permissive regular
 * expression suitable for most user-facing forms. For stricter
 * validation, consider using external libraries or server-side checks.
 */
export const email: Validator = (value) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email address';
  }
  return null;
};
