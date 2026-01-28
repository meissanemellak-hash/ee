import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          console.error('[GET /api/restaurants] Erreur synchronisation:', error)
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

      const [restaurants, total] = await Promise.all([
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
      ])

      return NextResponse.json({
        restaurants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Format simple (compatibilité avec l'ancien code)
    const restaurants = await prisma.restaurant.findMany({
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
    })

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, timezone, clerkOrgId } = body
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
          console.error('[POST /api/restaurants] Erreur synchronisation:', error)
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
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
