/**
 * The Login click that raced the idle sign-out ("Error login in", 1 Oct 2026).
 *
 * The browser came back to `/` with a session past its idle deadline. The
 * lifecycle hook signed it out, the user clicked Login a second later, the
 * sign-out's navigation cancelled the sign-in's CSRF fetch, and Auth.js
 * answered `MissingCSRF`. The retry then succeeded but landed back on
 * `/?error=MissingCSRF`, because the sign-in defaulted to the current URL.
 */
import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_SIGN_IN_TARGET,
  endSessionForLifecycle,
  signInRedirectTarget,
  startKeycloakSignIn,
  trackSignOut,
  waitForPendingSignOut,
} from './sign-in-flow';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('a sign-in waits for the sign-out in flight', () => {
  test('signIn is not called until the tracked sign-out settles', async () => {
    const events: string[] = [];
    const signOut = deferred();
    trackSignOut(signOut.promise.then(() => events.push('signed out')));

    const started = startKeycloakSignIn(async (provider) => {
      events.push(`sign in ${provider}`);
    }, '');

    await Promise.resolve();
    await Promise.resolve();
    expect(events).toEqual([]);

    signOut.resolve();
    await started;
    expect(events).toEqual(['signed out', 'sign in keycloak']);
  });

  test('a failed sign-out does not block or break the sign-in', async () => {
    const signOut = deferred();
    trackSignOut(signOut.promise).catch(() => {});
    let signedIn = false;
    const started = startKeycloakSignIn(async () => {
      signedIn = true;
    }, '');
    signOut.reject(new Error('network'));
    await started;
    expect(signedIn).toBe(true);
  });

  test('with nothing in flight the sign-in starts straight away', async () => {
    await waitForPendingSignOut();
    let signedIn = false;
    await startKeycloakSignIn(async () => {
      signedIn = true;
    }, '');
    expect(signedIn).toBe(true);
  });
});

describe('the lifecycle sign-out', () => {
  test('on / it ends the session without navigating', async () => {
    const calls: unknown[] = [];
    await endSessionForLifecycle(
      async (options: unknown) => {
        calls.push(options);
      },
      '/',
      { callbackUrl: '/' }
    );
    expect(calls).toEqual([{ redirect: false }]);
  });

  test('elsewhere it keeps the redirect home', async () => {
    const calls: unknown[] = [];
    await endSessionForLifecycle(
      async (options: unknown) => {
        calls.push(options);
      },
      '/users/dashboard/projects',
      { callbackUrl: '/' }
    );
    expect(calls).toEqual([{ callbackUrl: '/' }]);
  });

  test('is tracked, so a Login click waits for it', async () => {
    const signOut = deferred();
    const events: string[] = [];
    void endSessionForLifecycle(
      () => signOut.promise.then(() => events.push('signed out')),
      '/',
      { callbackUrl: '/' }
    );
    const started = startKeycloakSignIn(async () => {
      events.push('sign in');
    }, '?error=SessionExpired');
    await Promise.resolve();
    expect(events).toEqual([]);
    signOut.resolve();
    await started;
    expect(events).toEqual(['signed out', 'sign in']);
  });
});

describe('where the sign-in lands', () => {
  test('never back on the error landing it was started from', async () => {
    const targets: string[] = [];
    await startKeycloakSignIn(async (_provider, options) => {
      targets.push(options.redirectTo);
    }, '?error=MissingCSRF');
    expect(targets).toEqual([DEFAULT_SIGN_IN_TARGET]);
    expect(targets[0]).not.toContain('error');
  });

  test('honours a same-origin callbackUrl set for a protected page', () => {
    expect(
      signInRedirectTarget('?callbackUrl=%2Fusers%2Fdashboard%2Fprojects')
    ).toBe('/users/dashboard/projects');
    expect(signInRedirectTarget('?callbackUrl=/profile')).toBe('/profile');
  });

  test('ignores anything that is not a same-origin path', () => {
    for (const value of [
      'https://evil.example/x',
      '//evil.example/x',
      String.raw`/\evil.example`,
      'javascript:alert(1)',
      '/',
      '/?error=MissingCSRF',
      '',
    ]) {
      expect(
        signInRedirectTarget(`?${new URLSearchParams({ callbackUrl: value })}`)
      ).toBe(DEFAULT_SIGN_IN_TARGET);
    }
    expect(signInRedirectTarget('')).toBe(DEFAULT_SIGN_IN_TARGET);
  });
});
