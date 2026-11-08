import { validateAuthConfig } from '@/config/auth-config';

/**
 * The WorkOS settings this app reads itself, all of them when the server runs.
 *
 * The redirect URI is the one that needs care. `authkit-nextjs` reads only
 * `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, and Next inlines a `NEXT_PUBLIC_` variable into the bundle
 * when it is present at `next build`, so a value set during the image build would be frozen into
 * every container started from that image. The image build therefore never receives it (see the
 * Dockerfile), and with nothing to inline the read below stays a read of the server's environment.
 * The value is then handed to the library explicitly (`redirectUri` for `authkit` and the sign-in
 * URL, its origin as `baseURL` for `handleAuth`), so every request uses the value read for it.
 *
 * `baseURL` matters because the container's own hostname is not the public one: behind a reverse
 * proxy, `request.url` names the internal address, and a callback that redirected there would
 * leave the browser stranded.
 */

/** The default WorkOS API host, which also serves the hosted sign-out. */
const DEFAULT_WORKOS_API_HOSTNAME = 'api.workos.com';

export interface WorkosSettings {
  /** The public callback URL, `https://<web host>/callback`. */
  redirectUri: string;
  /** The public origin of the web app, taken from the redirect URI. */
  baseUrl: string;
  /** Whether cookies this app sets should be `Secure`. */
  secureCookies: boolean;
  /** Key for the activity cookie (`ECHNO_SESSION_ACTIVITY_SECRET`). */
  activitySecret: string;
}

let validated = false;

/**
 * The settings, validated on first use. A missing or malformed variable throws with every problem
 * named, which is the earliest point a WorkOS stack can fail: nothing reads these under Keycloak.
 */
export function getWorkosSettings(): WorkosSettings {
  if (!validated) {
    validateAuthConfig('workos');
    validated = true;
  }
  const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? '';
  const url = new URL(redirectUri);
  return {
    redirectUri,
    baseUrl: url.origin,
    secureCookies: url.protocol === 'https:',
    activitySecret: process.env.ECHNO_SESSION_ACTIVITY_SECRET ?? '',
  };
}

/**
 * The origin WorkOS's hosted sign-out is served from. The sign-out form posts to this app, which
 * answers with a redirect there, so the page's `form-action` has to allow it (`lib/csp.ts`).
 * Needs no validation, because it is used to build the CSP on every page.
 */
export function workosApiOrigin(): string {
  const hostname =
    process.env.WORKOS_API_HOSTNAME?.trim() || DEFAULT_WORKOS_API_HOSTNAME;
  return `https://${hostname}`;
}

/** Forgets the validation result. For tests that change the environment between cases. */
export function resetWorkosSettingsForTests(): void {
  validated = false;
}
