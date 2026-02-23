import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const alertTypeLabels: Record<string, string> = {
  OVERSTOCK: 'Surstock',
  SHORTAGE: 'Rupture de stock',
  OVERSTAFFING: 'Sur-effectif',
  UNDERSTAFFING: 'Sous-effectif',
  OTHER: 'Autre',
}

/** Normalise « rupture(s) » → « rupture(s) de stock » pour cohérence partout. */
function formatAlertMessage(msg: string): string {
  return msg.replace(/\b(ruptures?)\b(?!\s+de\s+stock)/gi, (_, word) => `${word} de stock`)
}

/**
 * GET /api/activity/recent
 * Récupère l'activité récente de l'organisation
 */
export async function GET(request: NextRequest) {
  try {
    // Pendant le build Next.js (collect page data), ne pas appeler la DB ni Clerk
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL
    if (isBuildPhase) {
      return NextResponse.json({ activities: [] })
    }

    const { auth } = await import('@clerk/nextjs/server')
    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getOrganizationForDashboard, getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')
    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    let organization: any = userId ? await getOrganizationForDashboard(userId) : null
    if (!organization && orgIdToUse) {
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
          const { logger } = await import('@/lib/logger')
          logger.error('[GET /api/activity/recent] Erreur synchronisation:', error)
        }
      }
    }
    if (!organization) {
      organization = await getCurrentOrganization()
    }
    if (!organization) {
      return NextResponse.json({ activities: [] })
    }

    const restaurantId = searchParams.get('restaurantId')
    const restaurantWhere = restaurantId
      ? { organizationId: organization.id, id: restaurantId }
      : { organizationId: organization.id }

    // Récupérer les activités récentes (30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0) // Début de journée

    // 1. Ventes récentes - Récupérer les 30 ventes les plus récentes (sans filtre de date pour inclure toutes les ventes)
    let recentSales: any[] = []
    try {
      recentSales = await prisma.sale.findMany({
        where: {
          restaurant: restaurantWhere,
        },
        include: {
          product: {
            select: {
              name: true,
            },
          },
          restaurant: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
        take: 30,
      })

    } catch (error) {
      const { logger } = await import('@/lib/logger')
      logger.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des ventes:', error)
      // Continuer avec un tableau vide plutôt que de planter
      recentSales = []
    }

    // 2. Recommandations acceptées récentes
    let recentAcceptedRecommendations: any[] = []
    try {
      recentAcceptedRecommendations = await prisma.recommendation.findMany({
        where: {
          restaurant: restaurantWhere,
          status: 'accepted',
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          restaurant: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      })

    } catch (error) {
      const { logger } = await import('@/lib/logger')
      logger.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des recommandations:', error)
      recentAcceptedRecommendations = []
    }

    // 3. Alertes créées récentes (filtrées par restaurant si restaurantId fourni)
    let recentAlerts: any[] = []
    try {
      recentAlerts = await prisma.alert.findMany({
        where: {
          restaurant: restaurantWhere,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          restaurant: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      })

    } catch (error) {
      const { logger } = await import('@/lib/logger')
      logger.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des alertes créées:', error)
      recentAlerts = []
    }

    // 4. Alertes résolues récentes
    let recentResolvedAlerts: any[] = []
    try {
      recentResolvedAlerts = await prisma.alert.findMany({
        where: {
          restaurant: restaurantWhere,
          resolved: true,
          resolvedAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          restaurant: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          resolvedAt: 'desc',
        },
        take: 10,
      })

    } catch (error) {
      const { logger } = await import('@/lib/logger')
      logger.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des alertes résolues:', error)
      recentResolvedAlerts = []
    }

    // Combiner toutes les activités et les trier par date
    const activities: Array<{
      id: string
      type: 'sale' | 'recommendation_accepted' | 'alert_created' | 'alert_resolved'
      title: string
      description: string
      restaurantName: string
      amount?: number
      date: Date
      icon: string
      severity?: string
    }> = []

    // Ajouter les ventes
    recentSales.forEach((sale) => {
      if (sale.product && sale.restaurant) {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: `Vente : ${sale.product.name}`,
          description: `${sale.quantity} unité${sale.quantity > 1 ? 's' : ''} vendue${sale.quantity > 1 ? 's' : ''}`,
          restaurantName: sale.restaurant.name,
          amount: sale.amount,
          date: sale.saleDate,
          icon: '💰',
        })
      }
    })

    // Ajouter les recommandations acceptées
    recentAcceptedRecommendations.forEach((rec) => {
      if (rec.restaurant) {
        const estimatedSavings = (rec.data as any)?.estimatedSavings || 0
        activities.push({
          id: `rec-${rec.id}`,
          type: 'recommendation_accepted',
          title: 'Recommandation acceptée',
          description: rec.message || 'Recommandation appliquée',
          restaurantName: rec.restaurant.name,
          amount: estimatedSavings,
          date: rec.updatedAt,
          icon: '✅',
        })
      }
    })

    // Ajouter les alertes créées (avec sévérité pour les couleurs du dashboard)
    recentAlerts.forEach((alert) => {
      if (alert.restaurant) {
        activities.push({
          id: `alert-${alert.id}`,
          type: 'alert_created',
          title: `Alerte : ${alertTypeLabels[alert.type] ?? alert.type}`,
          description: formatAlertMessage(alert.message),
          restaurantName: alert.restaurant.name,
          date: alert.createdAt,
          icon: '⚠️',
          severity: alert.severity ?? 'medium',
        })
      }
    })

    // Ajouter les alertes résolues (avec sévérité pour les couleurs du dashboard)
    recentResolvedAlerts.forEach((alert) => {
      if (alert.restaurant) {
        activities.push({
          id: `alert-resolved-${alert.id}`,
          type: 'alert_resolved',
          title: `Alerte résolue : ${alertTypeLabels[alert.type] ?? alert.type}`,
          description: formatAlertMessage(alert.message),
          restaurantName: alert.restaurant.name,
          date: alert.resolvedAt || alert.updatedAt,
          icon: '✓',
          severity: alert.severity ?? 'medium',
        })
      }
    })

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => b.date.getTime() - a.date.getTime())

    // Prendre les 20 plus récentes
    const recentActivities = activities.slice(0, 20)

    // Sérialiser les dates en ISO strings pour la réponse JSON
    const serializedActivities = recentActivities.map((activity) => ({
      ...activity,
      date: activity.date.toISOString(),
    }))

    return NextResponse.json({
      activities: serializedActivities,
    })
  } catch (error) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL
    if (isBuildPhase) {
      return NextResponse.json({ activities: [] })
    }
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/activity/recent] ❌ Erreur:', error)
    // Retourner 200 + tableau vide pour que le dashboard s'affiche sans erreur côté client
    return NextResponse.json({ activities: [] })
  }
}
