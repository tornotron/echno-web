/**
 * What the landing page says for each `?error=` code it is sent back with.
 *
 * Auth.js has both `pages.signIn` and `pages.error` set to `/`, so every code it
 * emits lands here: the error-page set (`Configuration`, `AccessDenied`,
 * `Verification`, `Default`), the sign-in-page set (`OAuthCallback`, `Callback`,
 * `SessionRequired`, ...) and the codes `proxy.ts` and `lib/auth/auth-utils.ts`
 * set themselves (`SessionExpired`, `session_revoked`, `logout_failed`, ...).
 *
 * `Configuration` needs care. Auth.js reports a failed state or PKCE check
 * (`InvalidCheck: state value could not be parsed`) under that code, which reads
 * as a server misconfiguration to whoever sees it. In practice it means the
 * state cookie the callback expected was gone or already consumed: a sign-in
 * that stalled and was retried, or two sign-ins started in parallel (a tab
 * pre-opened on `/?callbackUrl=...` plus a Login click on `/`) sharing one cookie.
 * The recovery is to sign out, which clears the Auth.js cookies, and try once
 * more. A genuine misconfiguration fails the same way every time, so the copy
 * leads with the retry and keeps "contact the administrator" as the fallback.
 */

export type AuthErrorKind =
  /** The state/PKCE check failed: stale or duplicate flow. Offer sign out + retry. */
  | 'stale-flow'
  /** The session ended (expired, idle, revoked). Sign in again. */
  | 'session-ended'
  /** The provider or callback refused the sign-in. */
  | 'sign-in-failed'
  /** Sign-out did not complete. */
  | 'sign-out-failed'
  /** A code this map does not know. */
  | 'unknown';

export interface AuthErrorMessage {
  kind: AuthErrorKind;
  title: string;
  description: string;
}

const MESSAGES: Record<string, AuthErrorMessage> = {
  Configuration: {
    kind: 'stale-flow',
    title: 'Sign-in could not be completed',
    description:
      'The sign-in that came back did not match the one this browser started. That happens when a sign-in was retried, or was started in two tabs at once. Sign out to clear the stale cookies and try again. If it keeps happening, contact the administrator.',
  },
  AccessDenied: {
    kind: 'sign-in-failed',
    title: 'Access denied',
    description:
      'Your account is not allowed to sign in to this console. Contact the administrator if you think it should be.',
  },
  Verification: {
    kind: 'sign-in-failed',
    title: 'Sign-in link no longer valid',
    description:
      'The sign-in link has expired or was already used. Start the sign-in again.',
  },
  OAuthSignin: {
    kind: 'sign-in-failed',
    title: 'Could not start sign-in',
    description:
      'The sign-in request to the identity provider could not be built. Try again; if it persists, contact the administrator.',
  },
  OAuthCallback: {
    kind: 'sign-in-failed',
    title: 'Sign-in did not complete',
    description:
      'The identity provider sent back a response this console could not accept. Try signing in again.',
  },
  OAuthCreateAccount: {
    kind: 'sign-in-failed',
    title: 'Account could not be created',
    description:
      'Your identity was confirmed but a console account could not be created for it. Contact the administrator.',
  },
  EmailCreateAccount: {
    kind: 'sign-in-failed',
    title: 'Account could not be created',
    description:
      'A console account could not be created for that email address. Contact the administrator.',
  },
  Callback: {
    kind: 'sign-in-failed',
    title: 'Sign-in did not complete',
    description:
      'Something failed while finishing the sign-in. Try again; if it persists, contact the administrator.',
  },
  OAuthAccountNotLinked: {
    kind: 'sign-in-failed',
    title: 'Account already exists',
    description:
      'An account with this email already exists under a different sign-in method. Use the method you signed up with.',
  },
  EmailSignin: {
    kind: 'sign-in-failed',
    title: 'Sign-in email not sent',
    description: 'The sign-in email could not be sent. Try again.',
  },
  CredentialsSignin: {
    kind: 'sign-in-failed',
    title: 'Sign-in failed',
    description:
      'The details you entered were not accepted. Check them and try again.',
  },
  SessionRequired: {
    kind: 'session-ended',
    title: 'Sign in to continue',
    description: 'That page needs you to be signed in.',
  },
  SessionExpired: {
    kind: 'session-ended',
    title: 'Session expired',
    description: 'Your session has expired. Sign in again to continue.',
  },
  session_expired: {
    kind: 'session-ended',
    title: 'Session expired',
    description: 'Your session has expired. Sign in again to continue.',
  },
  session_revoked: {
    kind: 'session-ended',
    title: 'Session ended',
    description:
      'Your session was ended by an administrator or from another device. Sign in again to continue.',
  },
  session_invalid: {
    kind: 'session-ended',
    title: 'Session invalid',
    description:
      'Your session was no longer valid and has been cleared. Sign in again.',
  },
  logout_failed: {
    kind: 'sign-out-failed',
    title: 'Sign-out did not complete',
    description:
      'There was a problem signing you out. Try again, or close the browser to end the session.',
  },
  Default: {
    kind: 'sign-in-failed',
    title: 'Sign-in failed',
    description: 'Something went wrong during sign-in. Try again.',
  },
};

/** Every code the map knows, for tests and for anyone adding a new one. */
export const KNOWN_AUTH_ERROR_CODES: readonly string[] = Object.keys(MESSAGES);

/**
 * The message for an `?error=` code. Unknown codes still get a visible message
 * that names the code, so a new Auth.js code is never silent again.
 */
export function describeAuthError(code: string): AuthErrorMessage {
  const known = MESSAGES[code];
  if (known) return known;
  return {
    kind: 'unknown',
    title: 'Sign-in failed',
    description: `The sign-in ended with an error this page does not recognise (${code}). Try again; if it persists, contact the administrator.`,
  };
}
