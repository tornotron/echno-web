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
  // The Content-Security-Policy is set in middleware.ts instead of here, because it
  // carries a per-request script nonce that a static header cannot. HSTS is set
  // without `preload` to avoid an irreversible domain-wide commitment on staging.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Attendance check-in reads the device camera and GPS from our own
          // pages, so both features are granted to this origin and to nothing
          // else. An empty allowlist here blocks the feature for every origin
          // including self, which made the browser refuse the permission
          // prompt outright and left the Mark Attendance dialog stuck on
          // "Location unavailable". The microphone is genuinely unused.
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
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
