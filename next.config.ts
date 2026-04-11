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
  // Security headers configuration.
  //  Tune CSP to your real asset hosts and avoid overly permissive policies (e.g., avoid 'unsafe-inline' if possible).
  //  HSTS should be enabled only on production HTTPS sites.
  //  Validate headers using browser DevTools and security scanners after deploying.
  // This section is commented out since it is currently injected to a proxy route in app/api/v1/[...path].route.ts.
  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         { key: "X-Content-Type-Options", value: "nosniff" },
  //         { key: "X-Frame-Options", value: "DENY" },
  //         { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  //         { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  //         { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  //         {
  //           key: "Content-Security-Policy",
  //           value:
  //             "default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted.cdn.example.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://echno-object-store.blr1.digitaloceanspaces.com; font-src 'self' https://fonts.gstatic.com;"
  //         }
  //       ]
  //     }
  //   ];
  // }
};

export default nextConfig;
