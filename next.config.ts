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
  // Security headers configuration — NOT CURRENTLY APPLIED.
  // Security headers are not set anywhere in this app yet. The block below is
  // a template kept for future enablement; uncommenting it will apply the
  // headers globally to every page, document, and API response.
  // Before enabling:
  //  • Tune the CSP to your real asset hosts and tighten 'unsafe-inline' if possible.
  //  • Confirm HSTS is only enabled on production HTTPS deployments.
  //  • Validate with browser DevTools and a security scanner after deploying.
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
