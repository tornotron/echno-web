import { SESSION_ACTIVITY } from '@/lib/auth/constants';
import {
  isIdlePastDeadline,
  isIdlePastProxyGrace,
} from '@/lib/auth/session-idle';

/**
 * The idle deadline under WorkOS, kept in a small signed cookie of our own.
 *
 * Under Keycloak the deadline rides on the Auth.js JWT, which the server encrypts and rewrites on
 * every session update (`lib/auth/session-idle.ts`). WorkOS's `wos-session` cookie is sealed by
 * `authkit-nextjs` and holds only what the library puts there, so it is not ours to write to.
 * This cookie carries the same three facts the JWT would: which WorkOS session it belongs to,
 * when the server last saw the client assert someone is present, and the organization the BFF
 * names in `X-Organization-Id`.
 *
 * It is signed, not encrypted. None of it is secret, and the signature is what matters: a caller
 * cannot move its own deadline forward. The timestamp is always the server's clock, stamped when
 * the cookie is written, exactly as `recordSessionActivity` does for Keycloak.
 *
 * A WorkOS session with no valid cookie for its id counts as ended. Under Keycloak an absent
 * timestamp means a session from before the deadline existed and is let through; here every
 * session is minted by our own callback, which always writes the cookie, so an absent or foreign
 * one means somebody removed it. Failing open would let them escape the deadline by doing so.
 * WorkOS's own inactivity timeout sits behind all of this.
 */

/** Cookie name. Not prefixed with `wos-`, so nothing in the library treats it as its own. */
export const ACTIVITY_COOKIE_NAME = 'echno-session-activity';

/**
 * How long the browser keeps the cookie after it was last written.
 *
 * Past the BFF's generous deadline the cookie has no work left to do, and an expired cookie reads
 * the same as an idle one, so letting the browser drop it then changes nothing and keeps a stale
 * value from lying around.
 */
export const ACTIVITY_COOKIE_MAX_AGE_SECONDS = Math.ceil(
  (SESSION_ACTIVITY.IDLE_SIGN_OUT_MS + SESSION_ACTIVITY.PROXY_IDLE_GRACE_MS) /
    1000
);

/** What the cookie records. */
export interface SessionActivity {
  /** The WorkOS session id (`sid` on the access token) this record belongs to. */
  sid: string;
  /** When the server last saw activity, in epoch milliseconds. */
  at: number;
  /** The organization the BFF sends as `X-Organization-Id`, when known. */
  org?: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[\w-]*$/.test(value)) return null;
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  try {
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.codePointAt(index) ?? 0;
    }
    return bytes;
  } catch {
    return null;
  }
}

function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function isSessionActivity(value: unknown): value is SessionActivity {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sid === 'string' &&
    record.sid.length > 0 &&
    typeof record.at === 'number' &&
    Number.isFinite(record.at) &&
    (record.org === undefined || typeof record.org === 'string')
  );
}

/**
 * Builds the cookie value: the record and its HMAC-SHA256, each base64url encoded.
 *
 * @param activity - What to record. `at` should be the server's own clock.
 * @param secret - `ECHNO_SESSION_ACTIVITY_SECRET`.
 */
export async function sealSessionActivity(
  activity: SessionActivity,
  secret: string
): Promise<string> {
  const payload = encoder.encode(JSON.stringify(activity));
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await signingKey(secret), payload)
  );
  return `${toBase64Url(payload)}.${toBase64Url(signature)}`;
}

/**
 * Reads a cookie value back, or null when it is missing, malformed or not signed with `secret`.
 * The comparison is the platform's own HMAC verify, which does not leak timing.
 */
export async function readSessionActivity(
  value: string | undefined,
  secret: string
): Promise<SessionActivity | null> {
  if (!value) return null;
  const [encodedPayload, encodedSignature, extra] = value.split('.');
  if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

  const payload = fromBase64Url(encodedPayload);
  const signature = fromBase64Url(encodedSignature);
  if (!payload || !signature) return null;

  const valid = await crypto.subtle.verify(
    'HMAC',
    await signingKey(secret),
    signature,
    payload
  );
  if (!valid) return null;

  try {
    const parsed: unknown = JSON.parse(decoder.decode(payload));
    return isSessionActivity(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Whether the session has run out, given its activity record.
 *
 * @param activity - The verified record, or null when there is none.
 * @param sessionId - The WorkOS session id the request carries.
 * @param now - Current time in epoch milliseconds.
 * @param deadline - `page` holds the session to the real deadline, as `jwt()` does under Keycloak.
 *   `bff` adds the proxy grace, for the reason `isIdlePastProxyGrace` gives.
 */
export function isActivityExpired(
  activity: SessionActivity | null,
  sessionId: string | undefined,
  now: number,
  deadline: 'page' | 'bff'
): boolean {
  if (!activity || !sessionId || activity.sid !== sessionId) return true;
  return deadline === 'bff'
    ? isIdlePastProxyGrace(activity.at, now)
    : isIdlePastDeadline(activity.at, now);
}

/** Cookie attributes. `secure` follows the public redirect URI, not the container's own URL. */
export function activityCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: ACTIVITY_COOKIE_MAX_AGE_SECONDS,
  };
}
