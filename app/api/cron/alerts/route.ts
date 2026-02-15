import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * GET /api/cron/alerts
 * Génère automatiquement les alertes (inventaire + prévisions) pour tous les restaurants.
 * Imports dynamiques pour éviter tout chargement Prisma/services au build.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    const { logger } = await import('@/lib/logger')
    logger.error('[cron/alerts] CRON_SECRET non configuré')
    return NextResponse.json(
      { error: 'Cron not configured' },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const querySecret = request.nextUrl.searchParams.get('secret')
  const providedSecret = request.headers.get('x-cron-secret') ?? bearerToken ?? querySecret

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db/prisma')
    const { runAllAlerts } = await import('@/lib/services/alerts')
    const { logger } = await import('@/lib/logger')

    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true },
    })

    const results: { restaurantId: string; restaurantName: string; ok: boolean; error?: string }[] = []

    for (const restaurant of restaurants) {
      try {
        await runAllAlerts(restaurant.id)
        results.push({ restaurantId: restaurant.id, restaurantName: restaurant.name, ok: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        results.push({ restaurantId: restaurant.id, restaurantName: restaurant.name, ok: false, error: msg })
        logger.error(`[cron/alerts] ${restaurant.name}:`, err)
      }
    }

    const okCount = results.filter((r) => r.ok).length
    return NextResponse.json({
      success: true,
      restaurantsProcessed: results.length,
      successCount: okCount,
      results,
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[cron/alerts]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
