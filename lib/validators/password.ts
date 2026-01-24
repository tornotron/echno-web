import { Validator } from './common';

/**
 * password
 *
 * Enforces a reasonably strong password policy suitable for most
 * enterprise applications: minimum length and presence of upper/lower
 * case, digits, and special characters. This is a client-side check
 * for UX — always validate and hash passwords on the server.
 */
export const password: Validator = (value) => {
  if (value.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(value)) {
    return 'Password must contain at least one number';
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return 'Password must contain at least one special character';
  }

  return null;
};
