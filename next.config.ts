import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable typed routes to fix /dev/lrt path corruption bug
  // TODO: Create security headers configuration
  typedRoutes: false,
  images: {
    remotePatterns: [
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backend.echno.xyz/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
