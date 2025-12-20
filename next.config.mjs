import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for demo mode only (AWS Amplify handles SSR natively)
  output: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'export' : undefined,

  // Set base path for GitHub Pages (if using repo pages)
  basePath: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NEXT_PUBLIC_BASE_PATH
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '',

  // Disable image optimization for static export
  images: {
    unoptimized: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  },

  // Optional: trailing slashes for better GitHub Pages compatibility
  trailingSlash: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',

  // Skip API routes during static export
  ...(process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && {
    // API routes are only available in non-demo mode
  }),

  // Ensure Prisma binaries are included in serverless functions (Next.js 16+)
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],

  // Production optimizations - reduce build size
  productionBrowserSourceMaps: false, // Disable source maps in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize bundle
  swcMinify: true,

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

