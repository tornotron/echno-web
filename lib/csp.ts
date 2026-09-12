import { logger } from '@/lib/logger';
import { storageOrigins } from '@/lib/storage-origins';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Builds a Content-Security-Policy carrying a fresh per-request script nonce.
 * The nonce lets script-src drop 'unsafe-inline': Next.js (and next-themes, via its
 * nonce prop) reads it from the request's content-security-policy header and stamps
 * it onto the inline scripts they emit, so an injected inline <script> without the
 * nonce is blocked. script-src allows 'wasm-unsafe-eval' but not 'unsafe-eval', so
 * string eval / the Function constructor stay blocked (the XSS surface) while
 * WebAssembly can still compile. The bundle does reach one eval-class call in a
 * browser: zod 4 probes `new Function("")` once per page to decide whether it may
 * JIT-compile object parsers. The throw is caught and zod falls back to its
 * interpreted path, so nothing breaks, but the browser still reports a violation
 * on every page (issue #426). `instrumentation-client.ts` sets zod's `jitless`
 * before any app code runs, which skips the probe; the policy itself is unchanged.
 * The `Function("return this")` fallbacks in other dependencies are dead in a
 * browser where self is defined, and the Turbopack runtime's WASM loader is the
 * only other live eval-class API. No 'strict-dynamic', so host allow-lists still
 * apply ('self' for the chunk files, the Cloudflare host for its beacon). Styles
 * keep 'unsafe-inline' because Next injects inline <style>.
 *
 * Lives here rather than in proxy.ts so it can be unit-tested without pulling
 * the auth wrapper in.
 */
/**
 * Object-storage origins the browser is allowed to `PUT` to for direct-to-
 * storage attachment uploads (presigned flow), and to read those attachments
 * back from. Defined once in `lib/storage-origins.ts`, which `next.config.ts`
 * reads too so the CSP and `next/image`'s remote patterns cannot name
 * different stores.
 *
 * An empty list is a broken deployment, not a safe default: with no storage
 * origin the browser blocks the presigned `PUT` before it is sent, and the
 * user is told the file failed to upload with nothing recorded anywhere. It
 * has shipped that way once already, so a production build without the
 * variable now says so in the log.
 */
function configuredStorageOrigins(): string[] {
  const origins = storageOrigins();
  if (origins.length === 0) warnOnceAboutMissingStorageOrigin();
  return origins;
}

let storageOriginWarned = false;

/**
 * Reports the missing storage origin the first time a CSP is built, rather
 * than on every request. Silent in development, where attachment uploads are
 * not expected to reach a real object store.
 */
function warnOnceAboutMissingStorageOrigin(): void {
  if (isDev || storageOriginWarned) return;
  storageOriginWarned = true;
  logger.error(
    'NEXT_PUBLIC_STORAGE_ORIGIN is not set; the CSP will block direct-to-storage attachment uploads',
    undefined,
    { expected: 'the origin the backend signs upload URLs against' }
  );
}

export function buildCsp() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCodePoint(...bytes));
  // The direct PUT to object storage is a cross-origin request from the
  // browser, so each storage origin must be allow-listed in connect-src (the
  // signed url carries its own auth; CORS on the bucket is the other half).
  const storage = configuredStorageOrigins();
  const connectSrc = [
    "'self'",
    'https://cloudflareinsights.com',
    ...storage,
  ].join(' ');
  // The same origins again: an attachment is uploaded through connect-src and
  // then rendered through img-src, so a store listed for one and not the other
  // stores files that can never be displayed. They are built from one list for
  // that reason.
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    ...storage,
    'https://images.unsplash.com',
  ].join(' ');
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /api/csp-report',
  ].join('; ');
  return { nonce, policy };
}
