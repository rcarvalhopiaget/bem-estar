/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  // Desabilitar a geração estática de páginas para simplificar o build
  output: 'standalone',
  staticPageGenerationTimeout: 120,
  experimental: {
    // Desabilitar optimizações que estão causando problemas
    optimizeCss: false,
    largePageDataBytes: 128 * 1000, // 128KB
    workerThreads: false,
    cpus: 1,
    esmExternals: 'loose',
    outputFileTracingRoot: __dirname,
    disableOptimizedLoading: true,
    serverComponents: false, // Desabilitar React Server Components
  }
}

module.exports = nextConfig
