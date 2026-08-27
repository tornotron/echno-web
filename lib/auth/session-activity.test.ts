import { afterEach, describe, expect, test } from 'bun:test';
import {
  clearLastActivity,
  minutesUntilIdleSignOut,
  readLastActivity,
  sessionIdleState,
  shouldKeepSessionAlive,
  writeLastActivity,
} from './session-activity';
import { SESSION_ACTIVITY } from './constants';

const NOW = 1_700_000_000_000;
const MINUTE = 60 * 1000;

afterEach(() => {
  clearLastActivity();
});

describe('session idle state', () => {
  test('someone who just did something is active', () => {
    expect(sessionIdleState(NOW, NOW)).toBe('active');
  });

  test('a long-running session stays active while it is being used', () => {
    // The session follows activity, not time since sign-in. Nothing about
    // having been signed in for hours ends it.
    expect(sessionIdleState(NOW - 30 * 1000, NOW)).toBe('active');
  });

  test('a short absence does not end the session', () => {
    // The complaint that started this: five minutes away should cost nothing.
    expect(sessionIdleState(NOW - 5 * MINUTE, NOW)).toBe('active');
    expect(shouldKeepSessionAlive(NOW - 5 * MINUTE, NOW)).toBe(true);
  });

  test('the warning arrives before the sign-out, not with it', () => {
    const warnAt =
      SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS;

    expect(sessionIdleState(NOW - warnAt + 1000, NOW)).toBe('active');
    expect(sessionIdleState(NOW - warnAt, NOW)).toBe('warning');
  });

  test('the session ends once the idle deadline passes', () => {
    expect(
      sessionIdleState(NOW - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS, NOW)
    ).toBe('expired');
    expect(
      shouldKeepSessionAlive(NOW - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS, NOW)
    ).toBe(false);
  });

  test('the app gives up before Keycloak does', () => {
    // Losing this race is what turns an explained sign-out into a page where
    // every request suddenly fails for no stated reason.
    expect(SESSION_ACTIVITY.IDLE_SIGN_OUT_MS).toBeLessThan(
      SESSION_ACTIVITY.KEYCLOAK_IDLE_TIMEOUT_MS
    );
  });

  test('there is time to react to the warning', () => {
    expect(SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS).toBeGreaterThan(
      SESSION_ACTIVITY.EVALUATION_INTERVAL_MS
    );
  });
});

describe('minutes until the idle sign-out', () => {
  test('the warning never reads zero while there is time left', () => {
    const almostOut = NOW - (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1000);
    expect(minutesUntilIdleSignOut(almostOut, NOW)).toBe(1);
  });

  test('it counts down in whole minutes', () => {
    const twoLeft = NOW - (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 2 * MINUTE);
    expect(minutesUntilIdleSignOut(twoLeft, NOW)).toBe(2);
  });

  test('it does not go negative once the deadline is past', () => {
    expect(
      minutesUntilIdleSignOut(NOW - 2 * SESSION_ACTIVITY.IDLE_SIGN_OUT_MS, NOW)
    ).toBe(0);
  });
});

describe('activity shared across tabs', () => {
  test('a tab reads activity another tab recorded', () => {
    // A background tab is not evidence that its owner is idle: they may be
    // working in the tab beside it, on the same session.
    writeLastActivity(NOW);
    expect(readLastActivity(NOW - 20 * MINUTE)).toBe(NOW);
  });

  test('a tab keeps its own activity when it is the more recent', () => {
    writeLastActivity(NOW - 20 * MINUTE);
    expect(readLastActivity(NOW)).toBe(NOW);
  });

  test('an empty store falls back to what the tab knows', () => {
    expect(readLastActivity(NOW)).toBe(NOW);
  });

  test('unreadable stored data falls back rather than throwing', () => {
    globalThis.localStorage.setItem(SESSION_ACTIVITY.STORAGE_KEY, 'not a time');
    expect(readLastActivity(NOW)).toBe(NOW);
  });

  test('signing out clears the shared timestamp', () => {
    // Left behind, it would hand the next sign-in an idle window that had
    // already half elapsed.
    writeLastActivity(NOW);
    clearLastActivity();
    expect(readLastActivity(NOW - MINUTE)).toBe(NOW - MINUTE);
  });
});
