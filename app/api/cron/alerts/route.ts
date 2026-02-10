import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runAllAlerts } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * GET /api/cron/alerts
 * Génère automatiquement les alertes (inventaire + prévisions) pour tous les restaurants.
 *
 * Sécurisé par CRON_SECRET (env). Vercel Cron envoie Authorization: Bearer <CRON_SECRET>
 * ou header x-cron-secret / query ?secret=.
 *
 * Planification (vercel.json) : toutes les heures (0 * * * *). Définir CRON_SECRET en production.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
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
    logger.error('[cron/alerts]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
