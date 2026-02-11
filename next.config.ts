import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/seller',
        destination: '/core/transaction2/seller',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/core/transaction3/admin',
        permanent: true,
      },
      {
        source: '/seller/:path*',
        destination: '/core/transaction2/seller/:path*',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/core/transaction3/admin/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
