import { Validator } from './common';

/**
 * name
 *
 * Validates a human name. This validator enforces a minimal length and
 * allows common punctuation used in names (spaces, apostrophes, periods,
 * and hyphens). It is intentionally permissive to support international
 * name formats; for stricter rules, apply additional constraints.
 */
export const name: Validator = (value) => {
  if (value.length < 2) {
    return 'Name must be at least 2 characters long';
  }

  if (!/^[a-zA-Z\s'.-]+$/.test(value)) {
    return 'Name contains invalid characters';
  }

  return null;
};
