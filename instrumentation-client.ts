import * as Sentry from '@sentry/nextjs'

// Permet à Sentry d'instrumenter les navigations (changements de route)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  debug: false,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
