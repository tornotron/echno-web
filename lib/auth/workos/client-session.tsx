'use client';

import type { Session } from 'next-auth';
import { SessionContext, type SignOutParams } from 'next-auth/react';
import {
  type ReactNode,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { isActivityAssertion } from '@/lib/auth/session-idle';
import {
  signInRedirectTarget,
  waitForPendingSignOut,
} from '@/lib/auth/sign-in-flow';

/**
 * The WorkOS session in the browser.
 *
 * It is served into Auth.js's own `SessionContext`, so `useAuthSession()` and everything built on
 * it (the session lifecycle, the organization header, the pages) read a WorkOS session through
 * the same hook and in the same shape as a Keycloak one. Only where the data comes from differs:
 * `/api/session` (`lib/auth/workos/routes.ts`), never the WorkOS library, which stays on the
 * server. No token reaches the browser.
 *
 * `update()` keeps the Auth.js meaning. With the activity assertion it tells the server someone
 * is here, which moves the idle deadline; with nothing it only reads the session, which refreshes
 * the access token when due.
 */

const SESSION_ENDPOINT = '/api/session';

type SessionState =
  | { data: Session; status: 'authenticated' }
  | { data: null; status: 'loading' | 'unauthenticated' };

let state: SessionState = { data: null, status: 'loading' };
const listeners = new Set<() => void>();

function setState(next: SessionState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): SessionState {
  return state;
}

async function requestSession(init?: RequestInit): Promise<Session | null> {
  const res = await fetch(SESSION_ENDPOINT, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...init,
  });
  if (!res.ok) {
    // Thrown rather than read as signed out. The lifecycle treats a failed round trip as one to
    // retry on its next tick, and an activity push it records as delivered never is again.
    throw new Error(`Session request failed with ${res.status}`);
  }
  const data = (await res.json()) as Session | null;
  setState(
    data
      ? { data, status: 'authenticated' }
      : { data: null, status: 'unauthenticated' }
  );
  return data;
}

/** Reads the session again. The refresh coordinator calls this under WorkOS. */
export function refreshWorkosSession(): Promise<Session | null> {
  return requestSession();
}

/** The `update` of the Auth.js session context, under WorkOS. */
export function updateWorkosSession(
  payload?: unknown
): Promise<Session | null> {
  if (isActivityAssertion(payload)) {
    return requestSession({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  return requestSession();
}

/**
 * Ends the session.
 *
 * With `redirect: false` it ends in place: the server revokes the WorkOS session and clears the
 * cookies, and the page stays where it is. Otherwise a form posts to `/sign-out`, which sends the
 * browser through WorkOS's hosted logout and back to `redirectTo` (or `callbackUrl`, or `/`).
 * A form rather than a fetch, because the hosted logout is a page the browser has to visit.
 */
export async function signOutWorkos(
  options?: SignOutParams<boolean>
): Promise<void> {
  if (options?.redirect === false) {
    try {
      await fetch(SESSION_ENDPOINT, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
    } finally {
      setState({ data: null, status: 'unauthenticated' });
    }
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/sign-out';
  form.style.display = 'none';
  const callbackUrl = document.createElement('input');
  callbackUrl.type = 'hidden';
  callbackUrl.name = 'callbackUrl';
  callbackUrl.value = options?.redirectTo ?? options?.callbackUrl ?? '/';
  form.append(callbackUrl);
  document.body.append(form);
  form.submit();
}

/**
 * Sends the person to `/sign-in`, after any sign-out still in flight, with the landing page the
 * query string names. The server checks the target again before using it.
 */
export async function startWorkosSignIn(search: string): Promise<void> {
  await waitForPendingSignOut();
  const target = signInRedirectTarget(search);
  globalThis.location.assign(
    `/sign-in?callbackUrl=${encodeURIComponent(target)}`
  );
}

/** Holds the WorkOS session for everything below it, in Auth.js's session context. */
export function WorkosSessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);

  useEffect(() => {
    requestSession().catch(() => {
      // Nothing to show yet and nothing to retry from: read it as signed out, as Auth.js does when
      // its first session fetch fails. A later update tries again.
      if (getState().status === 'loading') {
        setState({ data: null, status: 'unauthenticated' });
      }
    });
  }, []);

  const value = useMemo(
    () => ({ ...snapshot, update: updateWorkosSession }),
    [snapshot]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** Puts the store back to its first state. For tests. */
export function resetWorkosSessionForTests(): void {
  state = { data: null, status: 'loading' };
  listeners.clear();
}
