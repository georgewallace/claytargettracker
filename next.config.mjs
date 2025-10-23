/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for demo mode, standalone for AWS Amplify
  output: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'export' : 'standalone',
  
  // Set the correct root directory to prevent nested standalone builds
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  
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
}

export default nextConfig

