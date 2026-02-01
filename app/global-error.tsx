'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Une erreur est survenue</h1>
          <p>L&apos;équipe a été notifiée. Veuillez réessayer plus tard.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  )
}
