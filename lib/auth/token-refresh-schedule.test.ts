import { describe, expect, test } from 'bun:test';
import {
  isAccessTokenExpired,
  isWithinRefreshBuffer,
} from './token-refresh-schedule';
import { TOKEN_REFRESH } from './constants';

const NOW = 1_700_000_000_000;
const MINUTE = 60 * 1000;

describe('isAccessTokenExpired', () => {
  test('a token with time left is not expired', () => {
    expect(isAccessTokenExpired(NOW + MINUTE, NOW)).toBe(false);
  });

  test('a token past its expiry is expired', () => {
    expect(isAccessTokenExpired(NOW - 1, NOW)).toBe(true);
  });

  test('a token inside the clock skew allowance is treated as expired', () => {
    expect(isAccessTokenExpired(NOW + 1000, NOW)).toBe(true);
  });

  test('a session with no recorded expiry is left to the backend', () => {
    expect(isAccessTokenExpired(undefined, NOW)).toBe(false);
  });
});

describe('isWithinRefreshBuffer', () => {
  test('a token well inside its lifetime is left alone', () => {
    expect(
      isWithinRefreshBuffer(NOW + 4 * MINUTE, NOW)
    ).toBe(false);
  });

  test('a token inside the buffer is due for renewal', () => {
    expect(
      isWithinRefreshBuffer(NOW + TOKEN_REFRESH.REFRESH_BUFFER_MS - 1, NOW)
    ).toBe(true);
  });

  test('an expired token is due for renewal', () => {
    expect(isWithinRefreshBuffer(NOW - MINUTE, NOW)).toBe(true);
  });

  test('a session with no recorded expiry has nothing to renew', () => {
    expect(isWithinRefreshBuffer(undefined, NOW)).toBe(false);
  });

  test('the buffer is wider than the expiry allowance, so renewal comes first', () => {
    // A token must become "worth refreshing" before it becomes "too old to
    // send", or the proxy would start rejecting requests the client had no
    // reason to have renewed yet.
    const expiresAt = NOW + TOKEN_REFRESH.REFRESH_BUFFER_MS / 2;
    expect(isWithinRefreshBuffer(expiresAt, NOW)).toBe(true);
    expect(isAccessTokenExpired(expiresAt, NOW)).toBe(false);
  });
});
