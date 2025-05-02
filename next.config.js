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
}

export default nextConfig