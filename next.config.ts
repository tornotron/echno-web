import type { NextConfig } from 'next';

/**
 * Report-only Content-Security-Policy. Permissive where the app is known to need
 * it (Next.js ships inline scripts/styles; images come from DO Spaces + Unsplash;
 * the browser only talks to same-origin `/api`), so the useful signal is any
 * *unexpected* host. `report-uri` posts violations to the collector endpoint.
 * Tighten toward nonce-based `script-src` once the reports are clean.
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://echno-object-store.blr1.digitaloceanspaces.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self'",
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
  // CSP ships in *report-only* mode: it never blocks anything, it only reports
  // violations to /api/csp-report so the real asset/connect/script hosts can be
  // measured before an enforcing policy is turned on (with nonces for inline
  // scripts). HSTS is set without `preload` to avoid an irreversible domain-wide
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
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
