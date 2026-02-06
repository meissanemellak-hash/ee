const { withSentryConfig } = require('@sentry/nextjs')

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

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  // Remplacer disableLogger (déprécié) par webpack.treeshake.removeDebugLogging
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
}

// N'activer Sentry que si le DSN est configuré (évite les erreurs de build)
const useSentry =
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT

module.exports = useSentry ? withSentryConfig(nextConfig, sentryOptions) : nextConfig
