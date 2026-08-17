import type { NextConfig } from 'next';

/**
 * Enforced Content-Security-Policy. Permissive where the app is known to need it
 * (Next.js ships inline scripts/styles; images come from DO Spaces + Unsplash; the
 * browser only talks to same-origin `/api`), so anything from an unexpected host is
 * blocked. `report-uri` keeps posting violations to the collector so a resource an
 * unvisited page needs surfaces as a report rather than a silent break. Next tightening
 * step is a nonce-based `script-src` to drop `unsafe-inline`/`unsafe-eval`.
 */
const csp = [
  "default-src 'self'",
  // Cloudflare injects its privacy-analytics beacon on proxied responses; it loads
  // from static.cloudflareinsights.com and posts back to cloudflareinsights.com.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://echno-object-store.blr1.digitaloceanspaces.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'report-uri /api/csp-report',
].join('; ');

/**
 * next.config
 *
 * Application-level Next.js configuration. Kept concise and documented to
 * make deployment and routing constraints explicit for platform operators.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable typed routes to fix /dev/lrt path corruption bug
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'echno-object-store.blr1.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/users/dashboard/:path*',
        permanent: true,
      },
    ];
  },
  // Security headers, applied to every response. These are the safe set that
  // cannot break page rendering: clickjacking (X-Frame-Options), MIME sniffing
  // (X-Content-Type-Options), referrer leakage, feature access, and HTTPS pinning.
  // CSP is now enforced (after a clean report-only period): it blocks resources
  // from unexpected hosts while still posting violations to /api/csp-report, so a
  // resource an unvisited page needs surfaces as a report rather than a silent
  // break. HSTS is set without `preload` to avoid an irreversible domain-wide
  // commitment on staging.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
