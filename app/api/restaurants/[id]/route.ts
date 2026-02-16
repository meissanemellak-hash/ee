import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurants/[id]
 * Récupère un restaurant spécifique. Imports dynamiques pour le build.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { searchParams } = new URL(request.url)
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

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
          logger.error('[GET /api/restaurants/[id]] Erreur synchronisation:', error)
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

    // Récupérer le restaurant avec les compteurs et les ventes récentes
    const [restaurant, activeAlertsCount] = await Promise.all([
      prisma.restaurant.findFirst({
        where: {
          id: params.id,
          organizationId: organization.id,
        },
        include: {
          _count: {
            select: {
              sales: true,
              alerts: true,
              inventory: true,
            },
          },
        },
      }),
      prisma.alert.count({
        where: {
          restaurantId: params.id,
          resolved: false,
        },
      }),
    ])

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Chiffre d'affaires des 7 derniers jours (prix actuel du produit : quantity × unitPrice)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentSalesForRevenue = await prisma.sale.findMany({
      where: {
        restaurantId: restaurant.id,
        saleDate: { gte: sevenDaysAgo },
      },
      include: {
        product: { select: { unitPrice: true } },
      },
    })

    const totalRevenue = recentSalesForRevenue.reduce(
      (sum, s) => sum + s.quantity * s.product.unitPrice,
      0
    )

    // Récupérer les 10 dernières ventes
    const recentSales = await prisma.sale.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      take: 10,
      orderBy: {
        saleDate: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    // Construire la réponse : _count.alerts = alertes actives uniquement (non résolues)
    const response = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      timezone: restaurant.timezone,
      createdAt: restaurant.createdAt,
      _count: {
        ...restaurant._count,
        alerts: activeAlertsCount,
      },
      totalRevenue,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        amount: sale.amount,
        quantity: sale.quantity,
        saleDate: sale.saleDate.toISOString(),
        product: {
          name: sale.product.name,
        },
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/restaurants/[id]] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/restaurants/[id]
 * Supprime un restaurant (et ses données en cascade). Imports dynamiques pour le build.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const { searchParams } = new URL(request.url)
    let clerkOrgId = searchParams.get('clerkOrgId')
    if (!clerkOrgId) {
      try {
        const body = await request.json()
        clerkOrgId = (body as { clerkOrgId?: string }).clerkOrgId ?? null
      } catch {
        // body vide ou invalide
      }
    }
    const orgIdToUse = authOrgId || clerkOrgId

    let organization: Awaited<ReturnType<typeof prisma.organization.findUnique>> = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
    }
    if (!organization) {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        {
          error: 'Organization not found',
          details: "L'organisation n'a pas pu être trouvée. Veuillez rafraîchir la page.",
        },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, orgIdToUse ?? organization.clerkOrgId, 'restaurants:delete')
    if (forbidden) return forbidden

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    await prisma.restaurant.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[DELETE /api/restaurants/[id]] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
