import { describe, expect, it } from 'bun:test';
import {
  MAX_REFRESH_JITTER_MS,
  MIN_REFRESH_DELAY_MS,
  isAccessTokenExpired,
  msUntilAccessTokenRefresh,
  withRefreshJitter,
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

describe('withRefreshJitter', () => {
  it('spreads a scheduled refresh out by up to the jitter window', () => {
    const delay = 4 * MINUTE;

    expect(withRefreshJitter(delay, () => 0)).toBe(delay);
    expect(withRefreshJitter(delay, () => 0.5)).toBe(
      delay + MAX_REFRESH_JITTER_MS / 2
    );
    // random() never returns 1, so the added jitter stays inside the window.
    expect(withRefreshJitter(delay, () => 0.999)).toBeLessThan(
      delay + MAX_REFRESH_JITTER_MS
    );
  });

  it('stays well inside the refresh buffer, so a jittered timer still beats expiry', () => {
    expect(MAX_REFRESH_JITTER_MS).toBeLessThan(TOKEN_REFRESH.REFRESH_BUFFER_MS);
  });

  it('leaves a delay already at the floor alone, so recovery is not postponed', () => {
    expect(withRefreshJitter(MIN_REFRESH_DELAY_MS, () => 0.9)).toBe(
      MIN_REFRESH_DELAY_MS
    );
  });
});
