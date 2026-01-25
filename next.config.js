/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations pour éviter les problèmes de cache CSS
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Optimiser le cache Webpack pour réduire les warnings de performance
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Optimiser le cache pour le client
      config.cache = {
        ...config.cache,
        compression: 'gzip',
        maxMemoryGenerations: 1,
      }
    }
    
    // En développement, désactiver le cache pour éviter les problèmes de CSS
    if (dev) {
      config.cache = false
    }
    
    return config
  },
}

module.exports = nextConfig
