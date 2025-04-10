/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true, // Simplificar o processamento de imagens
  },
  // Desabilitar verificações de lint/type durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Resolver problema com o módulo undici
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false
    };
    return config;
  },
  // Configuração simples para o build
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig;
