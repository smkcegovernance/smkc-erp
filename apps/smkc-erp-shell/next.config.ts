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
}

export default nextConfig
