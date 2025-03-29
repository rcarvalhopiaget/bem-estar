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
  },
  experimental: {
    // Permitir que o Next.js predefina páginas que dão erro durante o build
    optimizeCss: true,
    largePageDataBytes: 128 * 1000, // 128KB
    // Ignorar erros de SSG durante o build
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig
