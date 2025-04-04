const withPWAInit = require("@ducanh2912/next-pwa").default;

const withPWA = withPWAInit({
  dest: "public", // Diretório onde os arquivos do PWA (service worker, manifest) serão gerados
  // register: true, // Automaticamente registra o service worker
  // skipWaiting: true, // Força o novo service worker a ativar imediatamente
  // disable: process.env.NODE_ENV === "development", // Desabilita PWA em modo de desenvolvimento para facilitar o debug
  // ^ COMENTADO PARA TESTAR EM DEV
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
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Resolver problema com o módulo undici
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   'undici': false
    // };
    return config;
  },
  // Desabilitar a geração estática de páginas para simplificar o build
  output: 'standalone',
  staticPageGenerationTimeout: 120,
  experimental: {
    largePageDataBytes: 128 * 1000, // 128KB
  }
}

// Envolver a configuração do Next com as configurações do PWA
module.exports = withPWA(nextConfig);
