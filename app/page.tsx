import { auth } from '@/auth';
import { WelcomeScreen } from '@/features/home/components/welcome-screen';

/**
 * The landing page doubles as Auth.js's `pages.signIn` and `pages.error`, so
 * every failed sign-in comes back here as `/?error=<code>`. The code is read on
 * the server, along with whether a session already exists, and handed to the
 * screen so the failure is visible instead of the page rendering as if nothing
 * happened (issue #425).
 *
 * `hasSession` matters for the parallel-sign-in case: two flows share one
 * state cookie, one fails the check and lands here with `?error=Configuration`,
 * the other completes. The session is then real, and the page says so rather
 * than reporting a failure. A session carrying an error (refresh failed, idle,
 * revoked) is not usable and does not count.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.error;
  const errorCode = Array.isArray(raw) ? raw[0] : raw;

  let hasSession = false;
  if (errorCode) {
    const session = await auth();
    hasSession = !!session?.user && !session.error;
  }

  return (
    <WelcomeScreen errorCode={errorCode || undefined} hasSession={hasSession} />
  );
}
