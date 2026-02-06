import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateBOMOrderRecommendations } from '@/lib/services/recommender-bom'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * GET /api/cron/recommendations
 * Génère automatiquement des recommandations BOM pour tous les restaurants de toutes les organisations.
 *
 * Sécurisé par CRON_SECRET (env). Vercel Cron envoie automatiquement Authorization: Bearer <CRON_SECRET>.
 * Sinon: header x-cron-secret, Authorization: Bearer <secret>, ou query ?secret=.
 *
 * Config: définir CRON_SECRET dans .env.local et dans Vercel (Project → Settings → Environment Variables).
 * Planification: vercel.json définit 0 6 * * * (tous les jours à 6h UTC).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/recommendations] CRON_SECRET non configuré')
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue'
          orgErrors.push(`${restaurant.name}: ${msg}`)
          console.error(`[cron/recommendations] ${restaurant.name}:`, err)
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
    console.error('[cron/recommendations]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
