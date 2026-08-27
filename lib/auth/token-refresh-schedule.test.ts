import { describe, expect, it } from 'bun:test';
import {
  MIN_REFRESH_DELAY_MS,
  isAccessTokenExpired,
  msUntilAccessTokenRefresh,
} from './token-refresh-schedule';
import { TOKEN_REFRESH } from './constants';

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

describe('msUntilAccessTokenRefresh', () => {
  it('schedules the refresh one buffer ahead of expiry', () => {
    const expiresAt = NOW + 5 * MINUTE;

    expect(msUntilAccessTokenRefresh(expiresAt, NOW)).toBe(
      5 * MINUTE - TOKEN_REFRESH.REFRESH_BUFFER_MS
    );
  });

  it('never schedules sooner than the minimum delay, so a short-lived token cannot spin', () => {
    const expiresAt = NOW + 30_000;

    expect(msUntilAccessTokenRefresh(expiresAt, NOW)).toBe(
      MIN_REFRESH_DELAY_MS
    );
  });

  it('falls back to the minimum delay when the token has already expired', () => {
    const expiresAt = NOW - MINUTE;

    expect(msUntilAccessTokenRefresh(expiresAt, NOW)).toBe(
      MIN_REFRESH_DELAY_MS
    );
  });

  it('returns null when there is no expiry to schedule from', () => {
    expect(msUntilAccessTokenRefresh(undefined, NOW)).toBeNull();
  });
});

describe('isAccessTokenExpired', () => {
  it('is false while the token is still inside its lifetime', () => {
    expect(isAccessTokenExpired(NOW + MINUTE, NOW)).toBe(false);
  });

  it('is true once expiry has passed', () => {
    expect(isAccessTokenExpired(NOW - 1, NOW)).toBe(true);
  });

  it('treats a token expiring within the clock-skew allowance as expired', () => {
    expect(isAccessTokenExpired(NOW + 1000, NOW)).toBe(true);
  });

  it('is false when there is no expiry recorded, leaving the backend to judge', () => {
    expect(isAccessTokenExpired(undefined, NOW)).toBe(false);
  });
});
