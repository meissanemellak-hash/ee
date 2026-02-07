import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const client = await clerkClient()
    
    // Récupérer les organisations de l'utilisateur depuis Clerk
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const userOrganizations = userMemberships.data || []
    
    // Récupérer l'organisation active depuis Clerk si orgId existe
    let activeClerkOrg = null
    if (orgId) {
      try {
        activeClerkOrg = await client.organizations.getOrganization({ organizationId: orgId })
      } catch (error) {
        logger.error('Error getting active org from Clerk:', error)
      }
    }
    
    // Vérifier dans la DB
    const orgsInDb = await Promise.all(
      userOrganizations.map(async (membership) => {
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
    
    // Vérifier l'organisation active dans la DB
    let activeOrgInDb = null
    if (orgId) {
      activeOrgInDb = await prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
      })
    }

    return NextResponse.json({
      userId,
      orgId,
      activeClerkOrg: activeClerkOrg ? {
        id: activeClerkOrg.id,
        name: activeClerkOrg.name,
      } : null,
      activeOrgInDb: activeOrgInDb ? {
        id: activeOrgInDb.id,
        name: activeOrgInDb.name,
        clerkOrgId: activeOrgInDb.clerkOrgId,
      } : null,
      allOrganizations: orgsInDb,
      summary: {
        hasOrgId: !!orgId,
        hasActiveClerkOrg: !!activeClerkOrg,
        hasActiveOrgInDb: !!activeOrgInDb,
        needsSync: !!orgId && !!activeClerkOrg && !activeOrgInDb,
      },
    })
  } catch (error) {
    logger.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
