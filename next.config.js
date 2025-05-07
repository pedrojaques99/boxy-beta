/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'zgdgcagndflxtzmsgrkt.supabase.co',
      'assets.awwwards.com',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Define which routes should not be statically generated
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.boxy.com.br', 'boxy.vercel.app'],
    },
  },
  // Disable static generation for all routes
  output: 'standalone',
  // Explicitly configure these routes for on-demand ISR
  async redirects() {
    return []
  },
  // Force specific paths to be treated as dynamic
  async rewrites() {
    return [
      {
        source: '/mindy',
        destination: '/mindy',
        has: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
        ],
      },
      {
        source: '/shop',
        destination: '/shop',
        has: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
        ],
      },
    ]
  },
}

export default nextConfig