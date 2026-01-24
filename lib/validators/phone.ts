import { Validator } from './common';

/**
 * phone
 *
 * Validates international phone numbers using a permissive E.164-like
 * pattern: optional leading `+` and 8-15 digits. This suits most
 * mobile/landline inputs; specialized formats can be validated server-side.
 */
export const phone: Validator = (value) => {
  if (!/^\+?[1-9]\d{7,14}$/.test(value)) {
    return 'Invalid phone number';
  }
  return null;
};
