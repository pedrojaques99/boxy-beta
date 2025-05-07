import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.boxy.com.br', 'boxy.vercel.app'],
    },
  },
  // Disable static generation for problematic routes
  output: 'standalone',
}

export default withNextIntl(nextConfig); 