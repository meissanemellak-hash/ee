import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Route API pour vérifier l'état complet de l'organisation
 * Utilisée pour le débogage et la vérification
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const client = await clerkClient()
    
    // Récupérer toutes les organisations de l'utilisateur depuis Clerk
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const userOrganizations = userMemberships.data || []
    
    // Chercher "graille M" spécifiquement
    const grailleM = userOrganizations.find(
      m => m.organization.name.toLowerCase().includes('graille')
    )
    
    // Récupérer l'organisation active depuis Clerk si orgId existe
    let activeClerkOrg = null
    if (orgId) {
      try {
        activeClerkOrg = await client.organizations.getOrganization({ organizationId: orgId })
      } catch (error) {
        logger.error('Error getting active org from Clerk:', error)
      }
    }
    
    // Vérifier l'organisation dans la DB via getCurrentOrganization()
    const organizationInDb = await getCurrentOrganization()
    
    // Vérifier "graille M" dans la DB
    let grailleMInDb = null
    if (grailleM) {
      grailleMInDb = await prisma.organization.findUnique({
        where: { clerkOrgId: grailleM.organization.id },
      })
    }

    return NextResponse.json({
      userId,
      orgId,
      activeClerkOrg: activeClerkOrg ? {
        id: activeClerkOrg.id,
        name: activeClerkOrg.name,
      } : null,
      organizationInDb: organizationInDb ? {
        id: organizationInDb.id,
        name: organizationInDb.name,
        clerkOrgId: organizationInDb.clerkOrgId,
      } : null,
      grailleM: grailleM ? {
        clerkOrgId: grailleM.organization.id,
        clerkName: grailleM.organization.name,
        isActive: grailleM.organization.id === orgId,
        inDb: !!grailleMInDb,
        dbId: grailleMInDb?.id || null,
        dbName: grailleMInDb?.name || null,
      } : null,
      allOrganizations: userOrganizations.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        isActive: m.organization.id === orgId,
      })),
      summary: {
        hasOrgId: !!orgId,
        hasActiveClerkOrg: !!activeClerkOrg,
        hasOrganizationInDb: !!organizationInDb,
        grailleMExists: !!grailleM,
        grailleMIsActive: grailleM?.organization.id === orgId,
        grailleMInDb: !!grailleMInDb,
        canAccessDashboard: !!orgId && !!organizationInDb,
        needsSync: !!orgId && !!activeClerkOrg && !organizationInDb,
      },
    })
  } catch (error) {
    logger.error('Check status error:', error)
    return NextResponse.json(
      { 
        error: 'Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
