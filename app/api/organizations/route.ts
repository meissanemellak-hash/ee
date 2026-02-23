import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/organizations
 * Récupère les données de l'organisation actuelle
 */
export async function GET(request: NextRequest) {
  const { logger } = await import('@/lib/logger')

  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
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

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')

    const { searchParams } = new URL(request.url)
    const clerkOrgId = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgId

    let organization: any = null

    try {
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
                } else {
                  throw dbError
                }
              }
            }
          } catch (syncError) {
            logger.error('[GET /api/organizations] Erreur synchronisation:', syncError)
          }
        }
      } else {
        organization = await getCurrentOrganization()
      }
    } catch (dbOrAuthError) {
      logger.error('[GET /api/organizations] Erreur base de données ou auth:', dbOrAuthError)
      // Fallback : tenter getCurrentOrganization (auth().orgId peut être renseigné)
      try {
        organization = await getCurrentOrganization()
      } catch {
        // ignore
      }
    }

    // Dernier recours : getCurrentOrganization puis getOrganizationForDashboard (memberships first)
    if (!organization) {
      organization = await getCurrentOrganization()
    }
    if (!organization && userId) {
      try {
        const { getOrganizationForDashboard } = await import('@/lib/auth')
        organization = await getOrganizationForDashboard(userId)
      } catch {
        // ignore
      }
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

    return NextResponse.json(organization)
  } catch (error) {
    logger.error('[GET /api/organizations] Erreur inattendue:', error)
    try {
      const { getCurrentOrganization } = await import('@/lib/auth')
      const organization = await getCurrentOrganization()
      if (organization) return NextResponse.json(organization)
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: 'Organization not found', details: 'L\'organisation n\'a pas pu être trouvée.' },
      { status: 404 }
    )
  }
}
