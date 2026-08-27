import { afterEach, describe, expect, test } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import {
  clearLastActivity,
  writeLastActivity,
} from '@/lib/auth/session-activity';
import {
  useSessionLifecycle,
  type LifecycleSession,
  type SessionLifecycleOptions,
} from './use-session-lifecycle';

/**
 * Nothing here replaces a module.
 *
 * The hook takes `signOut` and `notify` as arguments precisely so its whole
 * lifecycle can be driven with plain fakes. Reaching for `mock.module` would
 * swap those modules out for every other suite in the run too, and a sibling
 * suite that mocks the same module would then win or lose by import order.
 */

/** The session every test in this file runs as. */
const SESSION_ID = 'a97de708-bfbd-4414-bb04-c92896c7a178';

interface Recorder {
  signOuts: unknown[];
  updates: number;
  errors: { message: string; description: string }[];
  warnings: { message: string; description: string; action: () => void }[];
  dismissals: string[];
}

function recorder(): Recorder {
  return {
    signOuts: [],
    updates: 0,
    errors: [],
    warnings: [],
    dismissals: [],
  };
}

/** A live Keycloak session whose access token has plenty of life left. */
function liveSession(
  overrides: Partial<LifecycleSession> = {}
): LifecycleSession {
  return {
    provider: 'keycloak',
    sessionId: SESSION_ID,
    expiresAt: Date.now() + 5 * 60 * 1000,
    ...overrides,
  };
}

function options(
  log: Recorder,
  session: LifecycleSession | null,
  status: SessionLifecycleOptions['status'] = 'authenticated'
): SessionLifecycleOptions {
  return {
    session,
    status,
    update: async () => {
      log.updates++;
    },
    signOut: (arguments_) => log.signOuts.push(arguments_),
    notify: {
      error: (message, { description }) =>
        log.errors.push({ message, description }),
      warning: (message, { description, action }) =>
        log.warnings.push({
          message,
          description,
          action: action.onClick,
        }),
      dismiss: (id) => log.dismissals.push(id),
    },
  };
}

afterEach(() => {
  clearLastActivity();
});

describe('a session that ends without the app ending it', () => {
  test('the user is told, rather than left on a page that silently fails', async () => {
    // The failure that cost a user their work. The session vanished, the app
    // said nothing, and every request behind the still-signed-in-looking page
    // returned 401 until they gave up and reloaded.
    const log = recorder();
    const { rerender } = renderHook(
      (props: SessionLifecycleOptions) => useSessionLifecycle(props),
      { initialProps: options(log, liveSession()) }
    );

    rerender(options(log, null, 'unauthenticated'));

    await waitFor(() => expect(log.errors).toHaveLength(1));
    expect(log.errors[0].message).toBe('Your session has ended');
    expect(log.errors[0].description).toContain('sign in again');
    expect(log.signOuts).toHaveLength(1);
  });

  test('a visitor who was never signed in is not told their session ended', () => {
    const log = recorder();
    renderHook(() =>
      useSessionLifecycle(options(log, null, 'unauthenticated'))
    );

    expect(log.errors).toHaveLength(0);
    expect(log.signOuts).toHaveLength(0);
  });
});

describe('a session the server has marked as finished', () => {
  test('a refresh that cannot be recovered is explained', async () => {
    const log = recorder();
    renderHook(() =>
      useSessionLifecycle(
        options(log, liveSession({ error: 'RefreshAccessTokenError' }))
      )
    );

    await waitFor(() => expect(log.errors).toHaveLength(1));
    expect(log.errors[0].message).toBe('Your session has ended');
    expect(log.signOuts).toHaveLength(1);
  });

  test('a session ended elsewhere says so in its own words', async () => {
    const log = recorder();
    renderHook(() =>
      useSessionLifecycle(
        options(log, liveSession({ error: 'SessionRevoked' }))
      )
    );

    await waitFor(() => expect(log.errors).toHaveLength(1));
    expect(log.errors[0].message).toBe('Your session was ended');
  });
});

describe('the idle lifecycle', () => {
  test('a user who stepped away briefly is left alone', async () => {
    // Five minutes away, which is the complaint that started all this.
    const log = recorder();
    writeLastActivity(SESSION_ID, Date.now() - 5 * 60 * 1000);
    renderHook(() => useSessionLifecycle(options(log, liveSession())));

    await waitFor(() => expect(log.updates).toBeGreaterThanOrEqual(0));
    expect(log.signOuts).toHaveLength(0);
    expect(log.warnings).toHaveLength(0);
  });

  test('a warning arrives before the sign-out, with a way to stay', async () => {
    const log = recorder();
    writeLastActivity(
      SESSION_ID,
      Date.now() -
        (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS -
          SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS)
    );
    renderHook(() => useSessionLifecycle(options(log, liveSession())));

    await waitFor(() => expect(log.warnings).toHaveLength(1));
    expect(log.warnings[0].message).toContain('signed out in');
    expect(log.warnings[0].description).toContain('stay signed in');
    expect(log.signOuts).toHaveLength(0);
  });

  test('the "Stay signed in" button renews the session and clears the warning', async () => {
    const log = recorder();
    writeLastActivity(
      SESSION_ID,
      Date.now() -
        (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS -
          SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS)
    );
    renderHook(() => useSessionLifecycle(options(log, liveSession())));

    await waitFor(() => expect(log.warnings).toHaveLength(1));
    log.warnings[0].action();

    await waitFor(() => expect(log.updates).toBe(1));
    expect(log.dismissals).toContain('session-idle-warning');
    expect(log.signOuts).toHaveLength(0);
  });

  test('the session ends once the idle deadline passes, and says why', async () => {
    const log = recorder();
    writeLastActivity(
      SESSION_ID,
      Date.now() - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1000
    );
    renderHook(() => useSessionLifecycle(options(log, liveSession())));

    await waitFor(() => expect(log.signOuts).toHaveLength(1));
    expect(log.errors[0].message).toContain('inactivity');
  });

  test('a leftover clock from an earlier session does not follow the user in', async () => {
    // localStorage outlives the session that wrote it, so an entry from a
    // previous sign-in would otherwise be read as half an hour of idleness and
    // sign the user out moments after they signed back in.
    const log = recorder();
    writeLastActivity(
      'a-session-that-ended',
      Date.now() - 2 * SESSION_ACTIVITY.IDLE_SIGN_OUT_MS
    );
    renderHook(() => useSessionLifecycle(options(log, liveSession())));

    await waitFor(() => expect(log.errors).toHaveLength(0));
    expect(log.signOuts).toHaveLength(0);
    expect(log.warnings).toHaveLength(0);
  });

  test('an expiring token is renewed while the user is present', async () => {
    const log = recorder();
    writeLastActivity(SESSION_ID, Date.now());
    renderHook(() =>
      useSessionLifecycle(
        // Inside the refresh buffer, so it is due for renewal right now.
        options(log, liveSession({ expiresAt: Date.now() + 10 * 1000 }))
      )
    );

    await waitFor(() => expect(log.updates).toBe(1));
    expect(log.signOuts).toHaveLength(0);
  });

  test('an abandoned tab stops renewing, so the session can lapse on its own', async () => {
    // Refreshing forever would keep an abandoned session alive indefinitely,
    // which is exactly what the idle timeout exists to prevent.
    const log = recorder();
    writeLastActivity(
      SESSION_ID,
      Date.now() - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1000
    );
    renderHook(() =>
      useSessionLifecycle(
        options(log, liveSession({ expiresAt: Date.now() + 10 * 1000 }))
      )
    );

    await waitFor(() => expect(log.signOuts).toHaveLength(1));
    expect(log.updates).toBe(0);
  });
});
