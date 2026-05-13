import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@smkc/ui',
    '@smkc/auth',
    '@smkc/api-client',
    '@smkc/config',
    '@smkc/types',
    '@smkc/utils',
  ],
  async rewrites() {
    // The shell always proxies /depositmanager to the deposit-manager process on port 3002.
    // IIS ARR is NOT required — the shell handles the reverse proxy in both dev and production.
    return [
      {
        source: '/depositmanager',
        destination: 'http://localhost:3002/depositmanager',
      },
      {
        source: '/depositmanager/:path*',
        destination: 'http://localhost:3002/depositmanager/:path*',
      },
    ]
  },
}

export default nextConfig
