import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Route API pour forcer la synchronisation de l'organisation active dans Clerk
 * Cette route vérifie l'organisation active dans Clerk (via l'API) et la synchronise dans la DB
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    let orgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      userId = authResult.userId ?? null
      orgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const client = await clerkClient()

    // Si orgId existe dans les cookies, synchroniser cette organisation
    if (orgId) {
      let organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      })

      if (!organization) {
        try {
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId })

          organization = await prisma.organization.create({
            data: {
              name: clerkOrg.name,
              clerkOrgId: orgId,
              shrinkPct: 0.1,
            },
          })
        } catch (error) {
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgId },
            })
          } else {
            logger.error('Error syncing organization:', error)
          }
        }
      }
      return NextResponse.json({
        synced: !!organization,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          clerkOrgId: organization.clerkOrgId,
        } : null,
      })
    }

    // Si pas d'orgId dans les cookies, vérifier les organisations de l'utilisateur
    // et synchroniser la première organisation trouvée
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })

    if (!userMemberships.data || userMemberships.data.length === 0) {
      return NextResponse.json({ synced: false, error: 'No organizations found' }, { status: 404 })
    }

    // Synchroniser la première organisation de la liste
    const firstOrg = userMemberships.data[0].organization
    const clerkOrgId = firstOrg.id

    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId },
    })

    if (!organization) {
      try {
        organization = await prisma.organization.create({
          data: {
            name: firstOrg.name,
            clerkOrgId,
            shrinkPct: 0.1,
          },
        })
      } catch (dbError) {
        if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
          organization = await prisma.organization.findUnique({
            where: { clerkOrgId },
          })
        } else {
          throw dbError
        }
      }
    }

    return NextResponse.json({
      synced: !!organization,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        clerkOrgId: organization.clerkOrgId,
      } : null,
      message: organization ? 'Organization synced' : 'Organization not found',
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error in force-sync:', error)
    return NextResponse.json({ synced: false, organization: null }, { status: 200 })
  }
}
