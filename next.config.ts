import type { NextConfig } from 'next';

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
  // Note: an enforcing Content-Security-Policy is intentionally NOT set here yet.
  // A wrong CSP silently breaks the SPA (blocks scripts/styles/fonts/XHR), so it
  // needs to be tuned to the real asset and connect hosts and validated against a
  // running app (with nonces for inline scripts) before enforcing. HSTS is set
  // without `preload` to avoid an irreversible domain-wide commitment on staging.
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
        ],
      },
    ];
  },
};

export default nextConfig;
