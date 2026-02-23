import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/forecasts
 * Liste toutes les prévisions de l'organisation. Imports dynamiques pour le build.
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
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
    const { logger } = await import('@/lib/logger')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    // Priorité : getOrganizationForDashboard (memberships first) pour résolution org instantanée
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
          const isMember = userMemberships.data?.some((m: { organization: { id: string } }) => m.organization.id === orgIdToUse)
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
          logger.error('[GET /api/forecasts] Erreur synchronisation:', error)
        }
      }
    }
    if (!organization) {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json([])
    }

    // Récupérer les paramètres de filtrage
    const restaurantId = searchParams.get('restaurantId')
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const method = searchParams.get('method')

    // Construire la clause where
    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
    }

    if (restaurantId) {
      where.restaurantId = restaurantId
    }

    if (productId) {
      where.productId = productId
    }

    if (startDate || endDate) {
      where.forecastDate = {}
      if (startDate) {
        where.forecastDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.forecastDate.lte = new Date(endDate)
      }
    }

    if (method) {
      where.method = method
    }

    const forecasts = await prisma.forecast.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unitPrice: true,
          },
        },
      },
      orderBy: {
        forecastDate: 'desc',
      },
    })

    return NextResponse.json(forecasts)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching forecasts:', error)
    return NextResponse.json([])
  }
}
