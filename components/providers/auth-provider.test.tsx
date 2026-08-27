import { afterEach, describe, expect, mock, test } from 'bun:test';
import { render, waitFor } from '@testing-library/react';
import * as realAuth from 'next-auth/react';
import * as realApiClient from '@/lib/api/api-client';
import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import {
  clearLastActivity,
  writeLastActivity,
} from '@/lib/auth/session-activity';

/** The session every test in this file runs as. */
const SESSION_ID = 'a97de708-bfbd-4414-bb04-c92896c7a178';

/** Session the mocked `useSession` hands to the component under test. */
let sessionState: {
  status: 'authenticated' | 'loading' | 'unauthenticated';
  data: Record<string, unknown> | null;
} = { status: 'authenticated', data: null };

const signOutCalls: unknown[] = [];
const updateCalls: unknown[] = [];
const errorToasts: { message: string; description?: string }[] = [];
const warningToasts: { message: string; description?: string }[] = [];

mock.module('next-auth/react', () => ({
  ...realAuth,
  useSession: () => ({
    data: sessionState.data,
    status: sessionState.status,
    update: async () => {
      updateCalls.push(Date.now());
      return sessionState.data;
    },
  }),
  signOut: (options?: unknown) => {
    signOutCalls.push(options);
    return Promise.resolve();
  },
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    error: (message: string, options?: { description?: string }) =>
      errorToasts.push({ message, description: options?.description }),
    warning: (message: string, options?: { description?: string }) =>
      warningToasts.push({ message, description: options?.description }),
    success: () => {},
    info: () => {},
    dismiss: () => {},
  },
}));

// Spread the real module so its other exports survive; only the client the
// monitor touches is overridden.
mock.module('@/lib/api/api-client', () => ({
  ...realApiClient,
  apiClient: { setDefaultHeader: () => {} },
}));

const { SessionMonitor } = await import('./auth-provider');

/** A live Keycloak session whose access token has plenty of life left. */
function liveSession(overrides: Record<string, unknown> = {}) {
  return {
    provider: 'keycloak',
    sessionId: SESSION_ID,
    expiresAt: Date.now() + 5 * 60 * 1000,
    user: {},
    ...overrides,
  };
}

function renderMonitor() {
  return render(<SessionMonitor>{null}</SessionMonitor>);
}

afterEach(() => {
  sessionState = { status: 'authenticated', data: null };
  signOutCalls.length = 0;
  updateCalls.length = 0;
  errorToasts.length = 0;
  warningToasts.length = 0;
  clearLastActivity();
});

describe('a session that ends without the app ending it', () => {
  test('the user is told, rather than left on a page that silently fails', async () => {
    // The failure that cost a user their work. The session vanished, the app
    // said nothing, and every request behind the still-signed-in-looking page
    // returned 401 until they gave up and reloaded.
    sessionState = { status: 'authenticated', data: liveSession() };
    const view = renderMonitor();

    sessionState = { status: 'unauthenticated', data: null };
    view.rerender(<SessionMonitor>{null}</SessionMonitor>);

    await waitFor(() => expect(errorToasts).toHaveLength(1));
    expect(errorToasts[0].message).toBe('Your session has ended');
    expect(errorToasts[0].description).toContain('sign in again');
    expect(signOutCalls).toHaveLength(1);
  });

  test('a visitor who was never signed in is not told their session ended', () => {
    sessionState = { status: 'unauthenticated', data: null };
    renderMonitor();

    expect(errorToasts).toHaveLength(0);
    expect(signOutCalls).toHaveLength(0);
  });
});

describe('a session the server has marked as finished', () => {
  test('a refresh that cannot be recovered is explained', async () => {
    sessionState = {
      status: 'authenticated',
      data: liveSession({ error: 'RefreshAccessTokenError' }),
    };
    renderMonitor();

    await waitFor(() => expect(errorToasts).toHaveLength(1));
    expect(errorToasts[0].message).toBe('Your session has ended');
    expect(signOutCalls).toHaveLength(1);
  });

  test('a session ended elsewhere says so in its own words', async () => {
    sessionState = {
      status: 'authenticated',
      data: liveSession({ error: 'SessionRevoked' }),
    };
    renderMonitor();

    await waitFor(() => expect(errorToasts).toHaveLength(1));
    expect(errorToasts[0].message).toBe('Your session was ended');
  });
});

describe('the idle lifecycle', () => {
  test('a user who stepped away briefly is left alone', async () => {
    // Five minutes away, which is the complaint that started all this.
    writeLastActivity(SESSION_ID, Date.now() - 5 * 60 * 1000);
    sessionState = { status: 'authenticated', data: liveSession() };
    renderMonitor();

    await waitFor(() => expect(updateCalls.length).toBeGreaterThanOrEqual(0));
    expect(signOutCalls).toHaveLength(0);
    expect(warningToasts).toHaveLength(0);
  });

  test('a warning arrives before the sign-out, with a way to stay', async () => {
    writeLastActivity(
      SESSION_ID,
      Date.now() -
        (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS -
          SESSION_ACTIVITY.IDLE_WARNING_LEAD_MS)
    );
    sessionState = { status: 'authenticated', data: liveSession() };
    renderMonitor();

    await waitFor(() => expect(warningToasts).toHaveLength(1));
    expect(warningToasts[0].message).toContain('signed out in');
    expect(warningToasts[0].description).toContain('stay signed in');
    expect(signOutCalls).toHaveLength(0);
  });

  test('the session ends once the idle deadline passes, and says why', async () => {
    writeLastActivity(
      SESSION_ID,
      Date.now() - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1000
    );
    sessionState = { status: 'authenticated', data: liveSession() };
    renderMonitor();

    await waitFor(() => expect(signOutCalls).toHaveLength(1));
    expect(errorToasts[0].message).toContain('inactivity');
  });

  test('a leftover clock from an earlier session does not follow the user in', async () => {
    // localStorage outlives the session that wrote it, so an entry from a
    // previous sign-in would otherwise be read as half an hour of idleness and
    // sign the user out moments after they signed back in.
    writeLastActivity(
      'a-session-that-ended',
      Date.now() - 2 * SESSION_ACTIVITY.IDLE_SIGN_OUT_MS
    );
    sessionState = { status: 'authenticated', data: liveSession() };
    renderMonitor();

    await waitFor(() => expect(errorToasts).toHaveLength(0));
    expect(signOutCalls).toHaveLength(0);
    expect(warningToasts).toHaveLength(0);
  });

  test('an expiring token is renewed while the user is present', async () => {
    writeLastActivity(SESSION_ID, Date.now());
    sessionState = {
      status: 'authenticated',
      // Inside the refresh buffer, so it is due for renewal right now.
      data: liveSession({ expiresAt: Date.now() + 10 * 1000 }),
    };
    renderMonitor();

    await waitFor(() => expect(updateCalls).toHaveLength(1));
    expect(signOutCalls).toHaveLength(0);
  });

  test('an abandoned tab stops renewing, so the session can lapse on its own', async () => {
    // Refreshing forever would keep an abandoned session alive indefinitely,
    // which is exactly what the idle timeout exists to prevent.
    writeLastActivity(
      SESSION_ID,
      Date.now() - SESSION_ACTIVITY.IDLE_SIGN_OUT_MS - 1000
    );
    sessionState = {
      status: 'authenticated',
      data: liveSession({ expiresAt: Date.now() + 10 * 1000 }),
    };
    renderMonitor();

    await waitFor(() => expect(signOutCalls).toHaveLength(1));
    expect(updateCalls).toHaveLength(0);
  });
});
