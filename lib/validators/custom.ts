import { Validator } from './common';

/**
 * noSpaces
 *
 * Validator that fails when the provided value contains any whitespace
 * characters. A custom message may be provided for UX clarity.
 */
export const noSpaces =
  (message = 'Spaces are not allowed'): Validator =>
  (value) =>
    /\s/.test(value) ? message : null;

/**
 * startsWith
 *
 * Returns a validator that enforces a required prefix. Useful for
 * validating structured identifiers or codes that must begin with a
 * specific token.
 */
export const startsWith =
  (prefix: string): Validator =>
  (value) =>
    value.startsWith(prefix) ? null : `Must start with "${prefix}"`;
