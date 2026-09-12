'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { describeAuthError } from '@/lib/auth/auth-error-messages';

interface AuthErrorNoticeProps {
  /** The `?error=` code Auth.js (or proxy.ts) sent the landing page back with. */
  code: string;
  /**
   * Whether a usable session already exists for this browser. Set by the server
   * page from `auth()`. True in the parallel-sign-in case: one flow failed the
   * state check and landed here with `?error=`, while the other completed and
   * signed the user in. Telling them the sign-in failed would be wrong.
   */
  hasSession: boolean;
}

const buttonClass =
  'rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-60';

/**
 * The visible message for a `?error=` landing. Rendered above the Login and
 * Register buttons so the retry is right there.
 *
 * Three shapes:
 *   - A session exists: say so and offer Continue to the dashboard.
 *   - `Configuration` (a failed state or PKCE check, see the message map): the
 *     stale-cookie recovery, one click to sign out and return here clean.
 *   - Anything else: the message, and the Login button below does the retry.
 */
export function AuthErrorNotice({ code, hasSession }: AuthErrorNoticeProps) {
  const [signingOut, setSigningOut] = useState(false);
  const message = describeAuthError(code);

  if (hasSession) {
    return (
      <div
        role="status"
        className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900/80 p-4 text-left text-sm text-zinc-200"
      >
        <p className="font-semibold text-white">You are already signed in</p>
        <p className="mt-1 text-zinc-400">
          One of two sign-ins started at the same time did not complete, but the
          other did. Nothing is wrong with your session.
        </p>
        <Link
          href="/users/dashboard"
          className={`mt-3 inline-block ${buttonClass}`}
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  const staleFlow = message.kind === 'stale-flow';

  return (
    <div
      role="alert"
      className="w-full max-w-md rounded-lg border border-amber-500/40 bg-zinc-900/80 p-4 text-left text-sm text-zinc-200"
    >
      <p className="font-semibold text-white">{message.title}</p>
      <p className="mt-1 text-zinc-400">{message.description}</p>
      {staleFlow && (
        <button
          type="button"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            // POSTs to /api/auth/signout, which clears the Auth.js cookies, then
            // lands back here without the error so Login starts a clean flow.
            void signOut({ redirectTo: '/' }).finally(() =>
              setSigningOut(false)
            );
          }}
          className={`mt-3 ${buttonClass}`}
        >
          {signingOut ? 'Signing out...' : 'Sign out and try again'}
        </button>
      )}
    </div>
  );
}
