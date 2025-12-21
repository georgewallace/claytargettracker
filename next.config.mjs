import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {

  // Ensure Prisma binaries and other large server-only packages are externalized (Next.js 16+)
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/engines',
    'bcrypt',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-ssm',
  ],

  // Production optimizations - reduce build size
  productionBrowserSourceMaps: false, // Disable source maps in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize bundle
  swcMinify: true,

  // Turbopack config (Next.js 16+)
  turbopack: {},

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['recharts', '@dnd-kit/core', '@dnd-kit/sortable'],
  },

  // Exclude large dependencies from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default withBundleAnalyzer(nextConfig)

