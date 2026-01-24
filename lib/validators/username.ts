import { Validator } from './common';

/**
 * username
 *
 * Validates a username for length and allowed characters. This validator
 * permits letters, numbers, dots, underscores and hyphens and enforces a
 * conservative length range suitable for UI and URLs.
 */
export const username: Validator = (value) => {
  if (value.length < 4 || value.length > 20) {
    return 'Username must be between 4 and 20 characters';
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
  }

  return null;
};
