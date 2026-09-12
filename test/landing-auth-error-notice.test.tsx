/**
 * What the landing page shows when Auth.js sends it back with `?error=`.
 *
 * Both `pages.signIn` and `pages.error` point at `/`, so every failed sign-in
 * arrives here as a query parameter. Before #425 the page did not read it and
 * rendered as if nothing had happened, which read as "the Login button does
 * not work". Three things are checked:
 *
 *   - every code the map knows, and one it does not, renders a visible message;
 *   - `Configuration`, which is how Auth.js reports a failed state/PKCE check,
 *     renders the stale-cookie recovery: one click that signs out and returns
 *     to `/`;
 *   - when a session already exists (the parallel-sign-in case, where the
 *     other flow succeeded) the page says so and offers the dashboard instead
 *     of reporting a failure.
 *
 * Assertions stay on strings, never on a rendered node: an assertion that
 * fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

const signOutCalls: unknown[] = [];

import * as realNextAuth from 'next-auth/react';

mock.module('next-auth/react', () => ({
  ...realNextAuth,
  signOut: (options: unknown) => {
    signOutCalls.push(options);
    return Promise.resolve(undefined);
  },
  signIn: () => Promise.resolve(undefined),
}));

// `next/image` resolves its src against a loader that needs a real origin,
// which happy-dom does not give it. The logo is not what is under test.
mock.module('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', {
      src: props.src as string,
      alt: props.alt as string,
    }),
}));

let sessionValue: unknown = null;
let authCalls = 0;

mock.module('@/auth', () => ({
  auth: () => {
    authCalls += 1;
    return Promise.resolve(sessionValue);
  },
}));

const { default: WelcomePage } = await import('@/app/page');
const { AuthErrorNotice } =
  await import('@/features/home/components/auth-error-notice');
const { WelcomeScreen } =
  await import('@/features/home/components/welcome-screen');
const { describeAuthError, KNOWN_AUTH_ERROR_CODES } =
  await import('@/lib/auth/auth-error-messages');

afterEach(() => {
  cleanup();
  signOutCalls.length = 0;
});

describe('every ?error= code renders a visible message', () => {
  for (const code of KNOWN_AUTH_ERROR_CODES) {
    test(code, () => {
      const { title, description } = describeAuthError(code);
      const { container } = render(
        createElement(AuthErrorNotice, { code, hasSession: false })
      );
      const text = container.textContent ?? '';
      expect(title.length).toBeGreaterThan(0);
      expect(text).toContain(title);
      expect(text).toContain(description);
    });
  }

  test('an unknown code still gets a message that names it', () => {
    const { container } = render(
      createElement(AuthErrorNotice, {
        code: 'SomethingNew',
        hasSession: false,
      })
    );
    const text = container.textContent ?? '';
    expect(text).toContain('SomethingNew');
    expect(text).toContain('Sign-in failed');
  });

  test('the codes proxy.ts and auth-utils emit are all known', () => {
    for (const code of [
      'SessionExpired',
      'session_revoked',
      'session_invalid',
      'logout_failed',
    ]) {
      expect(describeAuthError(code).kind).not.toBe('unknown');
    }
  });
});

describe('Configuration is the stale or duplicate-flow case', () => {
  test('is described as a stale flow, and the copy does not blame the server first', () => {
    const message = describeAuthError('Configuration');
    expect(message.kind).toBe('stale-flow');
    expect(message.description).toContain('Sign out');
    expect(message.description.indexOf('Sign out')).toBeLessThan(
      message.description.indexOf('administrator')
    );
  });

  test('renders the one-click recovery that signs out and returns to /', async () => {
    const { getByRole } = render(
      createElement(AuthErrorNotice, {
        code: 'Configuration',
        hasSession: false,
      })
    );
    const button = getByRole('button', { name: 'Sign out and try again' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(signOutCalls).toHaveLength(1);
    expect(signOutCalls[0]).toEqual({ redirectTo: '/' });
  });

  test('other codes do not offer sign-out (there is nothing to clear)', () => {
    const { queryByRole } = render(
      createElement(AuthErrorNotice, {
        code: 'AccessDenied',
        hasSession: false,
      })
    );
    expect(
      queryByRole('button', { name: 'Sign out and try again' })
    ).toBeNull();
  });
});

describe('a session that already exists is not a failure', () => {
  test('says so and offers Continue to the dashboard', () => {
    const { container, getByRole } = render(
      createElement(AuthErrorNotice, {
        code: 'Configuration',
        hasSession: true,
      })
    );
    const text = container.textContent ?? '';
    expect(text).toContain('already signed in');
    expect(text).not.toContain('could not be completed');
    const link = getByRole('link', { name: 'Continue to dashboard' });
    expect(link.getAttribute('href')).toBe('/users/dashboard');
    expect(signOutCalls).toHaveLength(0);
  });

  test('a failed sign-out with the session still live is reported as that', () => {
    const { container, queryByRole } = render(
      createElement(AuthErrorNotice, {
        code: 'logout_failed',
        hasSession: true,
      })
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Sign-out did not complete');
    expect(text).not.toContain('already signed in');
    expect(queryByRole('link', { name: 'Continue to dashboard' })).toBeNull();
  });
});

async function renderPage(error: string | undefined) {
  const element = await WelcomePage({
    searchParams: Promise.resolve(error === undefined ? {} : { error }),
  });
  return render(element).container.textContent ?? '';
}

describe('the page hands the code and session state to the screen', () => {
  test('no error: no notice, and auth() is not consulted', async () => {
    authCalls = 0;
    sessionValue = { user: { name: 'Ravi' } };
    const text = await renderPage(undefined);
    expect(text).not.toContain('Sign-in');
    expect(authCalls).toBe(0);
  });

  test('error with a usable session: Continue', async () => {
    sessionValue = { user: { name: 'Ravi' } };
    const text = await renderPage('Configuration');
    expect(text).toContain('already signed in');
  });

  test('error with a session that itself carries an error: failure, not Continue', async () => {
    sessionValue = { user: { name: 'Ravi' }, error: 'RefreshAccessTokenError' };
    const text = await renderPage('SessionExpired');
    expect(text).toContain('Session expired');
    expect(text).not.toContain('already signed in');
  });

  test('error with no session: the message', async () => {
    sessionValue = null;
    const text = await renderPage('AccessDenied');
    expect(text).toContain('Access denied');
  });
});

describe('the welcome screen', () => {
  test('shows the notice only when an error code is present', () => {
    const clean = render(createElement(WelcomeScreen, { hasSession: false }));
    expect(clean.container.textContent).not.toContain('Sign-in');
    expect(clean.container.textContent).toContain('Login');
    cleanup();

    const failed = render(
      createElement(WelcomeScreen, {
        errorCode: 'OAuthCallback',
        hasSession: false,
      })
    );
    const text = failed.container.textContent ?? '';
    expect(text).toContain('Sign-in did not complete');
    expect(text).toContain('Login');
  });
});
