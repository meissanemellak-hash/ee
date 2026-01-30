import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/activity/recent
 * Récupère l'activité récente de l'organisation
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    console.log('[GET /api/activity/recent] userId:', userId, 'auth().orgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        console.log('[GET /api/activity/recent] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
              console.log(`[GET /api/activity/recent] ✅ Organisation "${organization.name}" synchronisée`)
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          console.error('[GET /api/activity/recent] Erreur synchronisation:', error)
        }
      }
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('[GET /api/activity/recent] Organisation trouvée:', organization.name, organization.id)

    const restaurantId = searchParams.get('restaurantId')
    const restaurantWhere = restaurantId
      ? { organizationId: organization.id, id: restaurantId }
      : { organizationId: organization.id }

    // Récupérer les activités récentes (30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0) // Début de journée

    console.log('[GET /api/activity/recent] Recherche activités depuis:', thirtyDaysAgo.toISOString())
    console.log('[GET /api/activity/recent] Organization ID:', organization.id)

    // 1. Ventes récentes - Récupérer les ventes des 30 derniers jours
    let recentSales: any[] = []
    try {
      recentSales = await prisma.sale.findMany({
        where: {
          restaurant: restaurantWhere,
          saleDate: {
            gte: thirtyDaysAgo,
          },
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

      console.log('[GET /api/activity/recent] Ventes trouvées:', recentSales.length)
      if (recentSales.length > 0) {
        console.log('[GET /api/activity/recent] Première vente:', {
          date: recentSales[0].saleDate,
          product: recentSales[0].product?.name,
          restaurant: recentSales[0].restaurant?.name,
        })
      }
    } catch (error) {
      console.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des ventes:', error)
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

      console.log('[GET /api/activity/recent] Recommandations acceptées trouvées:', recentAcceptedRecommendations.length)
    } catch (error) {
      console.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des recommandations:', error)
      recentAcceptedRecommendations = []
    }

    // 3. Alertes créées récentes
    let recentAlerts: any[] = []
    try {
      recentAlerts = await prisma.alert.findMany({
        where: {
          restaurant: {
            organizationId: organization.id,
          },
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

      console.log('[GET /api/activity/recent] Alertes créées trouvées:', recentAlerts.length)
    } catch (error) {
      console.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des alertes créées:', error)
      recentAlerts = []
    }

    // 4. Alertes résolues récentes
    let recentResolvedAlerts: any[] = []
    try {
      recentResolvedAlerts = await prisma.alert.findMany({
        where: {
          restaurant: restaurantWhere,
          resolved: true,
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

      console.log('[GET /api/activity/recent] Alertes résolues trouvées:', recentResolvedAlerts.length)
    } catch (error) {
      console.error('[GET /api/activity/recent] ❌ Erreur lors de la récupération des alertes résolues:', error)
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

    // Ajouter les alertes créées
    recentAlerts.forEach((alert) => {
      if (alert.restaurant) {
        activities.push({
          id: `alert-${alert.id}`,
          type: 'alert_created',
          title: `Alerte : ${alert.type}`,
          description: alert.message,
          restaurantName: alert.restaurant.name,
          date: alert.createdAt,
          icon: '⚠️',
        })
      }
    })

    // Ajouter les alertes résolues
    recentResolvedAlerts.forEach((alert) => {
      if (alert.restaurant) {
        activities.push({
          id: `alert-resolved-${alert.id}`,
          type: 'alert_resolved',
          title: `Alerte résolue : ${alert.type}`,
          description: alert.message,
          restaurantName: alert.restaurant.name,
          date: alert.updatedAt,
          icon: '✓',
        })
      }
    })

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => b.date.getTime() - a.date.getTime())

    console.log('[GET /api/activity/recent] Total activités combinées:', activities.length)

    // Prendre les 20 plus récentes
    const recentActivities = activities.slice(0, 20)

    // Sérialiser les dates en ISO strings pour la réponse JSON
    const serializedActivities = recentActivities.map((activity) => ({
      ...activity,
      date: activity.date.toISOString(),
    }))

    console.log('[GET /api/activity/recent] Activités sérialisées à retourner:', serializedActivities.length)

    return NextResponse.json({
      activities: serializedActivities,
    })
  } catch (error) {
    console.error('[GET /api/activity/recent] ❌ Erreur complète:', error)
    if (error instanceof Error) {
      console.error('[GET /api/activity/recent] ❌ Stack trace:', error.stack)
      console.error('[GET /api/activity/recent] ❌ Message:', error.message)
    }
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
