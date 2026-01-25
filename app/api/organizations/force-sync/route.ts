import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * Route API pour forcer la synchronisation de l'organisation active dans Clerk
 * Cette route vérifie l'organisation active dans Clerk (via l'API) et la synchronise dans la DB
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          
          return NextResponse.json({
            synced: true,
            organization: {
              id: organization.id,
              name: organization.name,
              clerkOrgId: organization.clerkOrgId,
            },
          })
        } catch (error) {
          console.error('Error syncing organization:', error)
          return NextResponse.json({ synced: false, error: 'Error syncing organization' }, { status: 500 })
        }
      }

      return NextResponse.json({
        synced: true,
        organization: {
          id: organization.id,
          name: organization.name,
          clerkOrgId: organization.clerkOrgId,
        },
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
    console.error('Error in force-sync:', error)
    return NextResponse.json(
      {
        synced: false,
        error: 'Error forcing sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
