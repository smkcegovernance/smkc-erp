import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@smkc/ui',
    '@smkc/auth',
    '@smkc/api-client',
    '@smkc/config',
    '@smkc/types',
    '@smkc/utils',
  ],
  async rewrites() {
    // In production, IIS handles /depositmanager routing directly to the app on port 3002.
    // Keep the rewrite only for local development.
    if (process.env.NODE_ENV === 'production') {
      return []
    }

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
