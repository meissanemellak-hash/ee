import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')
    const { generateBOMOrderRecommendations } = await import('@/lib/services/recommender-bom')

    const body = await request.json()
    const { clerkOrgId, ...restBody } = body
    const orgIdToUse = authOrgId || clerkOrgId

    logger.log('[POST /api/recommendations/bom] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
          
          const userMemberships = await client.users.getOrganizationMembershipList({ userId })
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
          if (isMember) {
            try {
              organization = await prisma.organization.create({
                data: {
                  name: clerkOrg.name,
                  clerkOrgId: orgIdToUse,
                  shrinkPct: 0.1,
                },
              })
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          logger.error('[POST /api/recommendations/bom] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: 'L\'organisation n\'a pas pu être trouvée. Veuillez rafraîchir la page.'
        },
        { status: 404 }
      )
    }

    const { restaurantId, days } = restBody

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant appartient à l'organisation AVANT de générer les recommandations
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Utiliser le % de gaspillage de l’organisation (paramètres) si le body n’en envoie pas
    // Toujours utiliser le % enregistré en paramètres pour que toute modification impacte les commandes
    const shrinkPct =
      typeof organization.shrinkPct === 'number' && organization.shrinkPct >= 0 && organization.shrinkPct <= 1
        ? organization.shrinkPct
        : 0.1

    const result = await generateBOMOrderRecommendations(
      restaurantId,
      shrinkPct,
      days || 7
    )

    // Log pour debug
    logger.log('[POST /api/recommendations/bom] Résultat:', {
      recommendationsCount: result.recommendations.length,
      hasDetails: !!result.details,
      reason: (result.details as any)?.reason,
    })

    // Sauvegarder la recommandation : soit des commandes à passer, soit une recommandation "surstocks" (ne pas commander)
    const details = result.details as unknown as { overstockIngredients?: Array<unknown>; reason?: string; period?: { start: string; end: string }; [k: string]: unknown }
    const hasOverstock = (details?.overstockIngredients?.length ?? 0) > 0
    const periodStart = details?.period?.start
    const periodEnd = details?.period?.end

    // Ne pas recréer une recommandation en attente si une recommandation pour la même période a déjà été rejetée
    const dismissedForRestaurant = await prisma.recommendation.findMany({
      where: { restaurantId, type: 'ORDER', status: 'dismissed' },
      select: { data: true },
    })
    const alreadyDismissedSamePeriod =
      !!periodStart &&
      !!periodEnd &&
      dismissedForRestaurant.some((r) => {
        const d = r.data as { period?: { start?: string; end?: string } } | null
        return d?.period?.start === periodStart && d?.period?.end === periodEnd
      })
    if (alreadyDismissedSamePeriod) {
      logger.log('[POST /api/recommendations/bom] Recommandation pour cette période déjà rejetée, pas de nouvelle création.')
    }

    let recommendationCreated = false
    if (result.recommendations.length > 0 && !alreadyDismissedSamePeriod) {
      const dataToSave = {
        ...result.details,
        estimatedSavings: result.estimatedSavings,
      }
      logger.log('[POST /api/recommendations/bom] Sauvegarde recommandation avec estimatedSavings:', result.estimatedSavings)
      await prisma.recommendation.create({
        data: {
          restaurantId,
          type: 'ORDER',
          data: dataToSave as any,
          priority: 'medium',
          status: 'pending',
        },
      })
      recommendationCreated = true
    } else if (hasOverstock && !alreadyDismissedSamePeriod) {
      // Créer une recommandation "surstock" pour lier alertes et recommandations : ne pas commander ces ingrédients
      const dataToSave = {
        ...result.details,
        estimatedSavings: 0,
      }
      logger.log('[POST /api/recommendations/bom] Sauvegarde recommandation surstocks (ne pas commander):', details.overstockIngredients?.length)
      await prisma.recommendation.create({
        data: {
          restaurantId,
          type: 'ORDER',
          data: dataToSave as any,
          priority: 'medium',
          status: 'pending',
        },
      })
      recommendationCreated = true
    } else if (!result.recommendations.length && !hasOverstock) {
      const reason = details?.reason || 'Aucune recommandation générée. Vérifiez que vous avez des produits avec des recettes et des ventes historiques.'
      logger.log('[POST /api/recommendations/bom] Aucune recommandation générée. Raison:', reason)
    }

    return NextResponse.json({ ...result, recommendationCreated })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error generating BOM recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
