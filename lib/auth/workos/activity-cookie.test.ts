import { describe, expect, test } from 'bun:test';

import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import {
  isActivityExpired,
  readSessionActivity,
  sealSessionActivity,
} from '@/lib/auth/workos/activity-cookie';

/**
 * The idle deadline under WorkOS. The cookie has to be unforgeable, and a session it does not
 * vouch for has to count as ended, or removing the cookie would be a way out of the deadline.
 */

const SECRET = 'activity-cookie-suite-secret-that-is-long-enough';
const MINUTE = 60 * 1000;
const NOW = Date.UTC(2026, 10, 8, 9, 0, 0);

describe('the signed record', () => {
  test('reads back what was sealed', async () => {
    const sealed = await sealSessionActivity(
      { sid: 'session_a', at: NOW, org: '42' },
      SECRET
    );
    expect(await readSessionActivity(sealed, SECRET)).toEqual({
      sid: 'session_a',
      at: NOW,
      org: '42',
    });
  });

  test('refuses a record signed with another key', async () => {
    const sealed = await sealSessionActivity(
      { sid: 'session_a', at: NOW },
      'another-secret-that-is-also-long-enough'
    );
    expect(await readSessionActivity(sealed, SECRET)).toBeNull();
  });

  test('refuses a record whose timestamp was edited', async () => {
    const sealed = await sealSessionActivity(
      { sid: 'session_a', at: NOW },
      SECRET
    );
    const [, signature] = sealed.split('.');
    const edited = Buffer.from(
      JSON.stringify({ sid: 'session_a', at: NOW + 60 * MINUTE })
    ).toString('base64url');
    expect(
      await readSessionActivity(`${edited}.${signature}`, SECRET)
    ).toBeNull();
  });

  test('refuses junk', async () => {
    for (const value of [undefined, '', 'x', 'a.b.c', '!!!.???', 'e30.']) {
      expect(await readSessionActivity(value, SECRET)).toBeNull();
    }
  });
});

describe('the deadline', () => {
  const record = (idleMinutes: number) => ({
    sid: 'session_a',
    at: NOW - idleMinutes * MINUTE,
  });
  const deadlineMinutes = SESSION_ACTIVITY.IDLE_SIGN_OUT_MS / MINUTE;
  const graceMinutes = SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS / MINUTE;

  test('a fresh record keeps the session', () => {
    expect(isActivityExpired(record(1), 'session_a', NOW, 'page')).toBe(false);
  });

  test('pages are held to the deadline itself', () => {
    expect(
      isActivityExpired(record(deadlineMinutes - 1), 'session_a', NOW, 'page')
    ).toBe(false);
    expect(
      isActivityExpired(record(deadlineMinutes), 'session_a', NOW, 'page')
    ).toBe(true);
  });

  test('the BFF allows the grace on top', () => {
    expect(
      isActivityExpired(record(deadlineMinutes + 1), 'session_a', NOW, 'bff')
    ).toBe(false);
    expect(
      isActivityExpired(
        record(deadlineMinutes + graceMinutes),
        'session_a',
        NOW,
        'bff'
      )
    ).toBe(true);
  });

  test('no record, or one for another session, has ended', () => {
    expect(isActivityExpired(null, 'session_a', NOW, 'page')).toBe(true);
    expect(isActivityExpired(record(1), 'session_b', NOW, 'page')).toBe(true);
    expect(isActivityExpired(record(1), undefined, NOW, 'bff')).toBe(true);
  });
});
