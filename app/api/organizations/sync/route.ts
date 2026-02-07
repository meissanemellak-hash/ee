import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Route API pour synchroniser toutes les organisations de Clerk avec la DB
 * Utile pour forcer la synchronisation manuellement
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clerkClient()
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const userOrganizations = userMemberships.data || []
    
    const syncedOrgs = []
    const errors = []
    
    for (const membership of userOrganizations) {
      const clerkOrgId = membership.organization.id
      
      try {
        // Vérifier si l'organisation existe déjà dans la DB
        let orgInDb = await prisma.organization.findUnique({
          where: { clerkOrgId },
        })
        
        // Si elle n'existe pas, la créer
        if (!orgInDb) {
          orgInDb = await prisma.organization.create({
            data: {
              name: membership.organization.name,
              clerkOrgId,
              shrinkPct: 0.1,
            },
          })
          syncedOrgs.push({
            clerkOrgId,
            name: orgInDb.name,
            action: 'created',
          })
        } else {
          syncedOrgs.push({
            clerkOrgId,
            name: orgInDb.name,
            action: 'already_exists',
          })
        }
      } catch (error) {
        errors.push({
          clerkOrgId,
          name: membership.organization.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      synced: syncedOrgs,
      errors: errors.length > 0 ? errors : undefined,
      total: userOrganizations.length,
    })
  } catch (error) {
    logger.error('Error syncing organizations:', error)
    return NextResponse.json(
      { 
        error: 'Error syncing organizations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
