import { describe, expect, it } from 'bun:test';
import { parseLocalDate } from '@tornotron/echno-core';

import {
  initialRegistrationFormData,
  toRegistrationRequest,
} from './registration';

describe('toRegistrationRequest', () => {
  it('sends the date of birth as a local calendar date with no offset', () => {
    const request = toRegistrationRequest({
      ...initialRegistrationFormData,
      dateOfBirth: parseLocalDate('2006-08-21'),
    });

    // The backend reads dateOfBirth as a strict LocalDateTime and rejects a
    // trailing offset, so a toISOString() value fails the whole request.
    expect(request.dateOfBirth).toBe('2006-08-21T00:00:00');
  });

  it('sends an empty date of birth when none was picked', () => {
    expect(toRegistrationRequest(initialRegistrationFormData).dateOfBirth).toBe(
      ''
    );
  });
});
