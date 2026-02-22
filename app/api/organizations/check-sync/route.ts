import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Route API pour vérifier si une organisation est synchronisée dans la DB
 * Utilisée par AutoRedirectOnActivation pour éviter les boucles de redirection
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ synced: false }, { status: 200 })
    }

    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      userId = authResult.userId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { clerkOrgId } = body

    if (!clerkOrgId) {
      return NextResponse.json({ error: 'clerkOrgId is required' }, { status: 400 })
    }

    // Vérifier si l'organisation existe dans la DB
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId },
    })

    // Si elle n'existe pas, essayer de la créer depuis Clerk
    if (!organization) {
      try {
        const client = await clerkClient()
        const clerkOrg = await client.organizations.getOrganization({ organizationId: clerkOrgId })

        // Vérifier que l'utilisateur est membre de cette organisation
        const userMemberships = await client.users.getOrganizationMembershipList({ userId })
        const isMember = userMemberships.data?.some(
          m => m.organization.id === clerkOrgId
        )

        if (isMember) {
          // Créer l'organisation dans la DB
          try {
            organization = await prisma.organization.create({
              data: {
                name: clerkOrg.name,
                clerkOrgId,
                shrinkPct: 0.1,
              },
            })
            logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk`)
          } catch (dbError) {
            // Si erreur de contrainte unique, récupérer l'organisation existante
            if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
              organization = await prisma.organization.findUnique({
                where: { clerkOrgId },
              })
            }
          }
        }
      } catch (error) {
        logger.error('❌ Error syncing organization:', error)
        // Si erreur, retourner non synchronisée
        return NextResponse.json({ synced: false }, { status: 200 })
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
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error checking organization sync:', error)
    return NextResponse.json(
      {
        synced: false,
        error: 'Error checking organization sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
