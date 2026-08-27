import { describe, expect, test } from 'bun:test';
import { SESSION_ACTIVITY } from './constants';
import {
  SESSION_ACTIVITY_UPDATE,
  isActivityAssertion,
  isActivitySyncDue,
  isIdlePastDeadline,
  isIdlePastProxyGrace,
  recordSessionActivity,
} from './session-idle';

const NOW = 1_800_000_000_000;
const MINUTE_MS = 60 * 1000;

/** A moment `minutes` before {@link NOW}. */
function minutesAgo(minutes: number): number {
  return NOW - minutes * MINUTE_MS;
}

describe('what counts as the client asserting activity', () => {
  test('the activity payload does', () => {
    expect(isActivityAssertion(SESSION_ACTIVITY_UPDATE)).toBe(true);
  });

  test('a plain refresh does not', () => {
    // The keep-alive runs on a timer, so treating it as activity would hold a
    // tab nobody is sitting at open forever, which is the whole failure the
    // deadline exists to prevent.
    expect(isActivityAssertion(undefined)).toBe(false);
    expect(isActivityAssertion(null)).toBe(false);
    expect(isActivityAssertion({})).toBe(false);
  });

  test('a payload that only looks like one does not', () => {
    expect(isActivityAssertion({ activity: 'yes' })).toBe(false);
    expect(isActivityAssertion({ activity: 1 })).toBe(false);
    expect(isActivityAssertion('activity')).toBe(false);
  });
});

describe('recording activity', () => {
  test('stamps the server clock, never a time the caller supplied', () => {
    const token: { lastActivityAt?: unknown } = {};

    recordSessionActivity(token, NOW);

    expect(token.lastActivityAt).toBe(NOW);
  });
});

describe('the deadline the session ends on', () => {
  test('a session used moments ago is alive', () => {
    expect(isIdlePastDeadline(minutesAgo(1), NOW)).toBe(false);
  });

  test('a session just short of the deadline is alive', () => {
    const at = NOW - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS + 1000;
    expect(isIdlePastDeadline(at, NOW)).toBe(false);
  });

  test('a session at the deadline is over', () => {
    const at = NOW - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS;
    expect(isIdlePastDeadline(at, NOW)).toBe(true);
  });

  test('a token carrying no recorded activity is left alone', () => {
    // Sessions minted before this shipped have no timestamp. Failing closed on
    // them would sign every signed-in user out the moment it deployed.
    expect(isIdlePastDeadline(undefined, NOW)).toBe(false);
    expect(isIdlePastDeadline(null, NOW)).toBe(false);
    expect(isIdlePastDeadline('a while ago', NOW)).toBe(false);
    expect(isIdlePastDeadline(Number.NaN, NOW)).toBe(false);
  });
});

describe('the deadline the proxy holds a session to', () => {
  test('leaves room for a timestamp as stale as an active client can leave it', () => {
    // The proxy reads what the last session update wrote, so for someone at the
    // keyboard it is routinely one sync interval behind, and further behind
    // when a push had to be retried. Refusing that request would sign a working
    // user out, which is a worse failure than an idle window that runs long.
    const stalest =
      NOW -
      SESSION_ACTIVITY.IDLE_SIGN_OUT_MS -
      2 * SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS +
      1000;

    expect(isIdlePastProxyGrace(stalest, NOW)).toBe(false);
  });

  test('still refuses a cookie that has gone quiet for good', () => {
    const at =
      NOW -
      SESSION_ACTIVITY.IDLE_SIGN_OUT_MS -
      SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS;

    expect(isIdlePastProxyGrace(at, NOW)).toBe(true);
  });

  test('is looser than the deadline the session actually ends on', () => {
    // Deliberate: `jwt()` is what enforces the real boundary, and it stops
    // minting access tokens there. By the time the proxy would refuse, the
    // bearer in that cookie has been dead for minutes.
    const between =
      NOW - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1 * MINUTE_MS;

    expect(isIdlePastDeadline(between, NOW)).toBe(true);
    expect(isIdlePastProxyGrace(between, NOW)).toBe(false);
  });

  test('a token carrying no recorded activity is left alone', () => {
    expect(isIdlePastProxyGrace(undefined, NOW)).toBe(false);
  });
});

describe('when the client should push its clock to the server', () => {
  test('not while there is nothing new to report', () => {
    // An abandoned tab would otherwise renew its own deadline on a timer.
    const activity = minutesAgo(20);
    expect(isActivitySyncDue(activity, activity, minutesAgo(19), NOW)).toBe(
      false
    );
  });

  test('not again before the interval is up', () => {
    expect(
      isActivitySyncDue(NOW, minutesAgo(1), minutesAgo(1), NOW)
    ).toBe(false);
  });

  test('once there is new activity and the interval has passed', () => {
    const lastSync = NOW - SESSION_ACTIVITY.SERVER_SYNC_INTERVAL_MS;
    expect(isActivitySyncDue(NOW, lastSync, lastSync, NOW)).toBe(true);
  });

  test('immediately on a client that has never pushed', () => {
    expect(isActivitySyncDue(NOW, 0, 0, NOW)).toBe(true);
  });
});
