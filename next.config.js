/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Resolver problema com o módulo undici
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false
    };
    return config;
  }
}

module.exports = nextConfig
