/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['storage.googleapis.com', 'lh3.googleusercontent.com', 'zgdgcagndflxtzmsgrkt.supabase.co', 'assets.awwwards.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
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
  async headers() {
    return [
      {
        source: '/mindy/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=3600, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/shop/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=3600, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig