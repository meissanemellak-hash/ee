import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Route debug org : imports dynamiques pour éviter échec au build. */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let orgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      userId = authResult.userId ?? null
      orgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const client = await clerkClient()

    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const userOrganizations = userMemberships.data || []

    let activeClerkOrg: { id: string; name: string } | null = null
    if (orgId) {
      try {
        const org = await client.organizations.getOrganization({ organizationId: orgId })
        activeClerkOrg = org ? { id: org.id, name: org.name } : null
      } catch (error) {
        logger.error('Error getting active org from Clerk:', error)
      }
    }

    const orgsInDb = await Promise.all(
      userOrganizations.map(async (membership: { organization: { id: string; name: string } }) => {
        const orgInDb = await prisma.organization.findUnique({
          where: { clerkOrgId: membership.organization.id },
        })
        return {
          clerkOrgId: membership.organization.id,
          clerkName: membership.organization.name,
          inDb: !!orgInDb,
          dbId: orgInDb?.id || null,
          dbName: orgInDb?.name || null,
        }
      })
    )

    let activeOrgInDb: { id: string; name: string; clerkOrgId: string } | null = null
    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      })
      activeOrgInDb = org ? { id: org.id, name: org.name, clerkOrgId: org.clerkOrgId } : null
    }

    return NextResponse.json({
      userId,
      orgId,
      activeClerkOrg,
      activeOrgInDb,
      allOrganizations: orgsInDb,
      summary: {
        hasOrgId: !!orgId,
        hasActiveClerkOrg: !!activeClerkOrg,
        hasActiveOrgInDb: !!activeOrgInDb,
        needsSync: !!orgId && !!activeClerkOrg && !activeOrgInDb,
      },
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Debug error:', error)
    return NextResponse.json(
      {
        error: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
