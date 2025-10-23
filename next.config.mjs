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
  
  // Ensure Prisma binaries are included in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines'],
  },
}

export default nextConfig

