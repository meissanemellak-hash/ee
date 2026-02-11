import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { generateBOMOrderRecommendations } from '@/lib/services/recommender-bom'
import { generateStaffingRecommendations } from '@/lib/services/recommender'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recommendations/generate-all
 * Génère des recommandations BOM pour tous les restaurants de l'organisation.
 * Body: { clerkOrgId?, shrinkPct?, days? }
 * Utilisation: bouton "Générer pour tous les restaurants" sur la page Recommandations.
 * Pour un cron (ex. Vercel Cron): appeler cette route avec les headers d'auth ou un token
 * (ex. Authorization: Bearer <token>) selon votre configuration.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { clerkOrgId, shrinkPct = 0.1, days = 7, type, forecastDate } = body
    const isStaffing = type === 'STAFFING'
    const staffingTargetDate = forecastDate ? new Date(forecastDate) : new Date()
    const orgIdToUse = authOrgId || clerkOrgId

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
          const isMember = userMemberships.data?.some((m: any) => m.organization.id === orgIdToUse)
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
          logger.error('[POST /api/recommendations/generate-all] Erreur sync org:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found', details: 'Aucune organisation trouvée.' },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'recommendations:view')
    if (forbidden) return forbidden

    const restaurants = await prisma.restaurant.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
    })

    if (restaurants.length === 0) {
      return NextResponse.json({
        success: true,
        generated: 0,
        byRestaurant: [],
        message: 'Aucun restaurant dans cette organisation.',
      })
    }

    const byRestaurant: { restaurantId: string; restaurantName: string; count: number }[] = []
    const errors: string[] = []

    if (isStaffing) {
      for (const restaurant of restaurants) {
        try {
          const result = await generateStaffingRecommendations(restaurant.id, staffingTargetDate)
          if (result.length > 0) {
            byRestaurant.push({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              count: 1,
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue'
          errors.push(`${restaurant.name}: ${msg}`)
          logger.error(`[generate-all STAFFING] ${restaurant.name}:`, err)
        }
      }
    } else {
      for (const restaurant of restaurants) {
        try {
          const result = await generateBOMOrderRecommendations(
            restaurant.id,
            typeof shrinkPct === 'number' ? shrinkPct : 0.1,
            typeof days === 'number' ? days : 7
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
            byRestaurant.push({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              count: result.recommendations.length,
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue'
          errors.push(`${restaurant.name}: ${msg}`)
          logger.error(`[generate-all] ${restaurant.name}:`, err)
        }
      }
    }

    const totalGenerated = byRestaurant.reduce((sum, r) => sum + r.count, 0)

    return NextResponse.json({
      success: true,
      generated: totalGenerated,
      byRestaurant,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    logger.error('Error generate-all recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
