import { NextRequest, NextResponse } from 'next/server';

/**
 * Sets a per-request Content-Security-Policy with a script nonce.
 *
 * The nonce lets us drop `'unsafe-inline'` and `'unsafe-eval'` from `script-src`:
 * Next.js reads the nonce from the request's `content-security-policy` header and
 * stamps it onto the scripts it emits, so its inline bootstrap is allowed while an
 * injected inline `<script>` (the classic XSS payload) is not. `'self'` still
 * covers the chunk files and the Cloudflare host still covers its analytics beacon
 * (no `'strict-dynamic'`, so host allow-lists keep working). Styles keep
 * `'unsafe-inline'` since Next injects inline styles that cannot be nonced.
 *
 * Because the policy is per-request, this lives in middleware rather than the
 * static `next.config` headers.
 */
export function middleware(request: NextRequest) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCodePoint(...bytes));

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://echno-object-store.blr1.digitaloceanspaces.com https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /api/csp-report',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js reads the nonce from this request header to stamp its script tags.
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

export const config = {
  // Run on documents only: skip API routes, Next's static assets, and prefetches
  // (a prefetch would cache a response whose nonce no longer matches the document).
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
