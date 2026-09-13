/**
 * The unknown-code branch of `describeAuthError` (#459): a code shaped like a
 * real Auth.js or app code is named in the message, anything else (spaces,
 * digits, punctuation, over-long text) is described without being quoted, so
 * `/?error=<text>` cannot put attacker-chosen wording into the app's own alert.
 */
import { describe, expect, test } from 'bun:test';
import { describeAuthError } from './auth-error-messages';

describe('describeAuthError with an unknown code', () => {
  test('quotes a code made of letters and underscores', () => {
    for (const code of ['SomethingNew', 'session_gone', 'A']) {
      const { kind, description } = describeAuthError(code);
      expect(kind).toBe('unknown');
      expect(description).toContain(`(${code})`);
      expect(description).not.toContain('unrecognised error code');
    }
  });

  test('does not quote a code with spaces, digits, punctuation or over 40 characters', () => {
    const phishing = 'call +91 98765 43210 to restore access';
    for (const code of [phishing, 'abc123', 'a.b', '<b>x</b>', 'A'.repeat(41), '']) {
      const { kind, description } = describeAuthError(code);
      expect(kind).toBe('unknown');
      expect(description).toContain('(an unrecognised error code)');
      if (code) expect(description).not.toContain(code);
    }
  });
});
