import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * GET /api/cron/recommendations
 * Génère automatiquement des recommandations BOM pour tous les restaurants.
 * Imports dynamiques pour éviter tout chargement Prisma/services au build.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    const { logger } = await import('@/lib/logger')
    logger.error('[cron/recommendations] CRON_SECRET non configuré')
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
    const { generateBOMOrderRecommendations } = await import('@/lib/services/recommender-bom')
    const { logger } = await import('@/lib/logger')

    const organizations = await prisma.organization.findMany({
      select: { id: true, shrinkPct: true },
    })

    let totalCreated = 0
    const byOrg: { orgId: string; created: number; errors: string[] }[] = []
    const errors: string[] = []

    for (const org of organizations) {
      const orgErrors: string[] = []
      let orgCreated = 0

      const restaurants = await prisma.restaurant.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true },
      })

      for (const restaurant of restaurants) {
        try {
          const result = await generateBOMOrderRecommendations(
            restaurant.id,
            typeof org.shrinkPct === 'number' ? org.shrinkPct : 0.1,
            7
          )

          if (result.recommendations.length > 0) {
            const details = result.details as { period?: { start: string; end: string } }
            const periodStart = details?.period?.start
            const periodEnd = details?.period?.end
            const dismissedForRestaurant = await prisma.recommendation.findMany({
              where: { restaurantId: restaurant.id, type: 'ORDER', status: 'dismissed' },
              select: { data: true },
            })
            const alreadyDismissedSamePeriod =
              !!periodStart &&
              !!periodEnd &&
              dismissedForRestaurant.some((r) => {
                const d = r.data as { period?: { start?: string; end?: string } } | null
                return d?.period?.start === periodStart && d?.period?.end === periodEnd
              })
            if (!alreadyDismissedSamePeriod) {
              const dataToSave = {
                ...result.details,
                estimatedSavings: result.estimatedSavings,
              }
              await prisma.recommendation.create({
                data: {
                  restaurantId: restaurant.id,
                  type: 'ORDER',
                  data: dataToSave as any,
                  priority: 'medium',
                  status: 'pending',
                },
              })
              orgCreated += result.recommendations.length
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue'
          orgErrors.push(`${restaurant.name}: ${msg}`)
          logger.error(`[cron/recommendations] ${restaurant.name}:`, err)
        }
      }

      totalCreated += orgCreated
      byOrg.push({ orgId: org.id, created: orgCreated, errors: orgErrors })
      errors.push(...orgErrors)
    }

    return NextResponse.json({
      success: true,
      organizationsProcessed: organizations.length,
      recommendationsCreated: totalCreated,
      byOrg: byOrg.map((o) => ({
        orgId: o.orgId,
        created: o.created,
        errorCount: o.errors.length,
      })),
      ...(errors.length > 0 && { errors: errors.slice(0, 20) }),
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[cron/recommendations]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
