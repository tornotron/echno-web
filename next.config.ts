import type { NextConfig } from 'next';
import { storageRemotePatterns } from './lib/storage-origins';

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
  // next/image refuses a remote host that is not listed here, on top of
  // whatever the CSP says, so the object store has to appear in both. The
  // store's entry comes from the same list the CSP is built from rather than
  // being written out a second time, because the two had drifted: this list
  // still named a DigitalOcean Spaces bucket belonging to a retired box, so an
  // attachment uploaded to the live store was accepted and then never
  // rendered.
  //
  // Read while building, not while running: `output: 'standalone'` freezes
  // this config into the build, so `NEXT_PUBLIC_STORAGE_ORIGIN` is a Docker
  // build argument as well as a runtime variable.
  images: {
    remotePatterns: [
      ...storageRemotePatterns(),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
