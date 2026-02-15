import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Accepter clerkOrgId depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams
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
          const { logger } = await import('@/lib/logger')
          logger.error('[GET /api/restaurants] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json([])
    }

    // Support de la pagination (optionnel pour compatibilité)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const usePagination = pageParam !== null || limitParam !== null

    if (usePagination) {
      const page = parseInt(pageParam || '1')
      const limit = parseInt(limitParam || '50') || 50
      const skip = (page - 1) * limit

      const [restaurants, total, activeAlertsByRestaurant] = await Promise.all([
        prisma.restaurant.findMany({
          where: { organizationId: organization.id },
          orderBy: { name: 'asc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                sales: true,
                alerts: true,
              },
            },
          },
        }),
        prisma.restaurant.count({
          where: { organizationId: organization.id },
        }),
        prisma.alert.groupBy({
          by: ['restaurantId'],
          where: {
            resolved: false,
            restaurant: { organizationId: organization.id },
          },
          _count: { id: true },
        }),
      ])

      const activeCountMap = new Map(
        activeAlertsByRestaurant.map((r) => [r.restaurantId, r._count.id])
      )
      const restaurantsWithActiveAlerts = restaurants.map((r) => ({
        ...r,
        _count: {
          ...r._count,
          alerts: activeCountMap.get(r.id) ?? 0,
        },
      }))

      return NextResponse.json({
        restaurants: restaurantsWithActiveAlerts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Format simple (compatibilité avec l'ancien code)
    const [restaurants, activeAlertsByRestaurant] = await Promise.all([
      prisma.restaurant.findMany({
        where: { organizationId: organization.id },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              sales: true,
              alerts: true,
            },
          },
        },
      }),
      prisma.alert.groupBy({
        by: ['restaurantId'],
        where: {
          resolved: false,
          restaurant: { organizationId: organization.id },
        },
        _count: { id: true },
      }),
    ])

    const activeCountMap = new Map(
      activeAlertsByRestaurant.map((r) => [r.restaurantId, r._count.id])
    )
    const restaurantsWithActiveAlerts = restaurants.map((r) => ({
      ...r,
      _count: {
        ...r._count,
        alerts: activeCountMap.get(r.id) ?? 0,
      },
    }))

    return NextResponse.json(restaurantsWithActiveAlerts)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { name, address, timezone, clerkOrgId: clerkOrgIdFromBody } = body
    const orgIdToUse = authOrgId || clerkOrgIdFromBody

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
          const { logger } = await import('@/lib/logger')
          logger.error('[POST /api/restaurants] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      )
    }

    const forbidden = await checkApiPermission(userId, orgIdToUse || organization.clerkOrgId, 'restaurants:create')
    if (forbidden) return forbidden

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        organizationId: organization.id,
        name,
        address: address || null,
        timezone: timezone || 'Europe/Paris',
      },
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
