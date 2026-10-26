'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, ArrowLeft, Home, LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { startKeycloakSignIn } from '@/lib/auth/sign-in-flow';
import { routes } from '@/nav';

/**
 * What a failed load means for the person looking at the page. Only the
 * statuses that call for a different next step get their own kind; every
 * other failure keeps the generic message.
 */
export type LoadErrorKind = 'session' | 'forbidden' | 'not-found' | 'generic';

/**
 * Reads the HTTP status off a failed load. `ApiError` from echno-core carries
 * `status`; the field is read structurally so the check also holds for an
 * error that crossed a module boundary or reached a Next error boundary.
 * `isAuthError` is not used because it groups 401 with 403.
 */
export function loadErrorKind(error: unknown): LoadErrorKind {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status: unknown }).status
      : undefined;
  if (status === 401) return 'session';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  return 'generic';
}

const COPY: Record<LoadErrorKind, { title: string; message: string }> = {
  session: {
    title: 'Your session has expired',
    message: 'Sign in again to continue.',
  },
  forbidden: {
    title: "You don't have access to this page",
    message: 'Ask your administrator if you need it.',
  },
  'not-found': {
    title: 'Not found',
    message: 'This item does not exist or has been removed.',
  },
  generic: {
    title: 'Something went wrong',
    message: 'Failed to load data. Please try again later.',
  },
};

function signInAgain() {
  const here = `${globalThis.location.pathname}${globalThis.location.search}`;
  const search = `?${new URLSearchParams({ callbackUrl: here }).toString()}`;
  void startKeycloakSignIn(signIn, search);
}

/**
 * The notice shown in place of a page whose data failed to load, worded by
 * the HTTP status: an expired session offers to sign in, a refusal says the
 * page is not available to this user and offers a way out, a missing record
 * says so, and anything else keeps the generic message.
 */
export function LoadErrorNotice({ error }: { error: unknown }) {
  const router = useRouter();
  const kind = loadErrorKind(error);
  const { title, message } = COPY[kind];
  const Icon = kind === 'forbidden' ? Lock : AlertCircle;

  return (
    <div
      role="alert"
      className="flex min-h-[400px] flex-col items-center justify-center text-center"
    >
      <Icon
        className={`mb-4 h-12 w-12 ${kind === 'generic' ? 'text-red-500' : 'text-zinc-400'}`}
      />
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-zinc-500">{message}</p>

      {kind === 'session' && (
        <Button className="mt-6 gap-2" onClick={signInAgain}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      )}

      {(kind === 'forbidden' || kind === 'not-found') && (
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button asChild className="gap-2">
            <Link href={routes.href}>
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
