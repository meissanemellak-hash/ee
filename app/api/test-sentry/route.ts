import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/test-sentry?secret=XXX
 * Envoie un événement de test à Sentry pour vérifier la config en prod.
 * Protégé par SENTRY_TEST_SECRET (à définir sur Vercel, optionnel).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.SENTRY_TEST_SECRET
  const provided =
    request.nextUrl.searchParams.get('secret') ??
    request.headers.get('x-sentry-test-secret')

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const testError = new Error(
    '[Test] Sentry configuré correctement – IA Restaurant Manager'
  )
  Sentry.captureException(testError)

  return NextResponse.json({
    ok: true,
    message: 'Événement de test envoyé à Sentry. Vérifie ton projet Sentry.',
  })
}
