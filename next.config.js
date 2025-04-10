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
  // Configuração para o build standalone
  output: 'standalone',
  // Aumentar timeout para páginas estáticas
  staticPageGenerationTimeout: 180,
  // Desativar header 'x-powered-by'
  poweredByHeader: false,
  // Comprimir respostas
  compress: true,
  // Desativar strict mode para obter melhor performance
  experimental: {
    // Desativar React strict mode em produção
    strictMode: false
  },
  swcMinify: true,
}

module.exports = nextConfig;
