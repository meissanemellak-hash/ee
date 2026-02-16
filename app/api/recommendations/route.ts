import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
          logger.error('[GET /api/recommendations] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json([])
    }

    const restaurantId = searchParams.get('restaurantId')
    const type = searchParams.get('type') // 'ORDER' | 'STAFFING' | null (all)

    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
    }

    // Si aucun filtre de statut n'est spécifié, on filtre par défaut sur 'pending'
    if (!searchParams.get('status') || searchParams.get('status') === 'pending') {
      where.status = 'pending'
    } else if (searchParams.get('status') !== 'all') {
      where.status = searchParams.get('status')
    }

    if (restaurantId && restaurantId !== 'all') {
      where.restaurantId = restaurantId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      select: {
        id: true,
        restaurantId: true,
        type: true,
        data: true,
        priority: true,
        status: true,
        createdAt: true,
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { generateOrderRecommendations, generateStaffingRecommendations } = await import('@/lib/services/recommender')

    const body = await request.json()
    const { clerkOrgId, ...restBody } = body
    const orgIdToUse = authOrgId || clerkOrgId

    logger.log('[POST /api/recommendations] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

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
          logger.error('[POST /api/recommendations] Erreur synchronisation:', error)
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

    const { restaurantId, type, forecastDate } = restBody

    if (process.env.NODE_ENV === 'development') {
      logger.log('[POST /api/recommendations] type=', type, 'restaurantId=', restaurantId)
    }

    if (!restaurantId || !type) {
      return NextResponse.json(
        { error: 'restaurantId and type are required' },
        { status: 400 }
      )
    }

    const date = forecastDate ? new Date(forecastDate) : new Date()

    if (type === 'ORDER') {
      const recommendations = await generateOrderRecommendations(restaurantId, date)
      return NextResponse.json({ success: true, recommendations })
    }
    if (type === 'STAFFING') {
      const result = await generateStaffingRecommendations(restaurantId, date)
      return NextResponse.json({
        success: true,
        recommendations: result.recommendations,
        recommendationCreated: result.recommendationCreated,
        alreadyDismissedForPeriod: result.alreadyDismissedForPeriod,
      })
    }
    return NextResponse.json(
      { error: 'Invalid type. Must be ORDER or STAFFING' },
      { status: 400 }
    )
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
