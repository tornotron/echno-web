/**
 * Validator type
 *
 * A synchronous validator takes a string value and returns either a
 * validation error message or `null` when the value is considered valid.
 */
export type Validator = (value: string) => string | null;

/**
 * optional
 *
 * Wraps a `Validator` and makes it accept empty values as valid. Useful
 * for form fields that are not required but still need format checks
 * when populated.
 */
export const optional =
  (validator: Validator): Validator =>
  (value) => {
    if (!value || value.trim() === '') return null;
    return validator(value);
  };

/**
 * compose
 *
 * Chains multiple validators. Returns the first error message produced
 * or `null` when all validators succeed. This helps build complex field
 * validation rules from small, focused validators.
 */
export const compose =
  (...validators: Validator[]): Validator =>
  (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };

/**
 * required
 *
 * Basic required-field validator which returns a friendly message using
 * the provided `fieldName` when the value is empty or whitespace.
 */
export const required =
  (fieldName = 'This field'): Validator =>
  (value) =>
    !value || value.trim() === '' ? `${fieldName} is required` : null;
