import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/current
 * Récupère l'ID de l'utilisateur actuel depuis le serveur
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = auth().userId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      userId,
      source: 'server-side auth()',
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/user/current] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
