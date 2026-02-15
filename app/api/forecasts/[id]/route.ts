import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/forecasts/[id]
 * Récupère une prévision spécifique. Imports dynamiques pour le build.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
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
          logger.error('[GET /api/forecasts/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Forecast not found' },
        { status: 404 }
      )
    }

    const forecast = await prisma.forecast.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
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
    })

    if (!forecast) {
      return NextResponse.json(
        { error: 'Forecast not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(forecast)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching forecast:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forecasts/[id]
 * Supprime une prévision. Imports dynamiques pour le build.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')
    const { checkApiPermission } = await import('@/lib/auth-role')

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
          logger.error('[DELETE /api/forecasts/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      logger.error('[DELETE /api/forecasts/[id]] Organisation non trouvée. authOrgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: orgIdToUse 
            ? 'L\'organisation existe dans Clerk mais n\'a pas pu être synchronisée dans la base de données. Veuillez rafraîchir la page.'
            : 'Aucune organisation active. Veuillez sélectionner une organisation.'
        },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'forecasts:generate')
    if (forbidden) return forbidden

    const forecast = await prisma.forecast.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
    })

    if (!forecast) {
      return NextResponse.json(
        { error: 'Forecast not found' },
        { status: 404 }
      )
    }

    await prisma.forecast.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Forecast deleted successfully' })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error deleting forecast:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
