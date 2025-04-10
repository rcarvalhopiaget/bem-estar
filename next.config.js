const withPWAInit = require("@ducanh2912/next-pwa").default;

const withPWA = withPWAInit({
  dest: "public", // Diretório onde os arquivos do PWA (service worker, manifest) serão gerados
  // register: true, // Automaticamente registra o service worker
  // skipWaiting: true, // Força o novo service worker a ativar imediatamente
  disable: process.env.NODE_ENV === "development", // Desabilita PWA em modo de desenvolvimento para facilitar o debug
  cacheOnFrontEndNav: true, // Cacheia páginas durante a navegação no cliente
  aggressiveFrontEndNavCaching: true, // Tenta cachear mais agressivamente
  reloadOnOnline: true, // Recarrega a página quando volta a ficar online
  swcMinify: true, // Usa o compilador SWC do Next.js para minificar o service worker
  workboxOptions: {
    disableDevLogs: true, // Desabilita logs do Workbox em desenvolvimento
  },
  fallbacks: {
    // Exemplo de fallback para documentos quando offline
    // document: "/_offline", // Você precisaria criar a página src/app/_offline/page.tsx
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    // Otimizações adicionais para imagens
    unoptimized: process.env.NODE_ENV === "development" ? true : false,
  },
  // Desabilitar verificação de tipo durante o build para acelerar
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
    
    // Otimizações adicionais para webpack
    if (!isServer) {
      // Não incluir o react-dom no cliente para reduzir o tamanho do bundle
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-dom-server-rendering-stub)[\\/]/,
          name: 'framework',
          priority: 40,
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
  // Configuração para gerar build standalone
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  experimental: {
    largePageDataBytes: 256 * 1000, // 256KB
    serverComponentsExternalPackages: ['sharp'],
    // Otimizações do compilador
    optimizeCss: true,
    // Aumentar tempo limite para compilação de páginas estáticas
    staticPageGenerationTimeout: 180,
  },
  // Comprimir saída para reduzir tamanho
  compress: true,
}

// Envolver a configuração do Next com as configurações do PWA
module.exports = withPWA(nextConfig);
