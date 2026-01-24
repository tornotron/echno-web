import { Validator } from './common';

/**
 * website
 *
 * Validates that a string parses as an HTTP/HTTPS URL. Returns a
 * user-friendly error message for invalid inputs.
 */
export const url: Validator = (value) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'Website URL must start with http or https';
    }
    return null;
  } catch {
    return 'Invalid website URL';
  }
};
