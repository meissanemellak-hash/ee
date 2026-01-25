import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * Route API pour nettoyer les organisations orphelines
 * (qui existent dans la DB mais pas dans Clerk)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { deleteAll = false } = body

    // Récupérer toutes les organisations de l'utilisateur depuis Clerk
    const client = await clerkClient()
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const clerkOrgIds = new Set(
      userMemberships.data?.map(m => m.organization.id) || []
    )

    console.log('📋 Organisations Clerk de l\'utilisateur:', Array.from(clerkOrgIds))

    // Récupérer toutes les organisations de la DB
    const allOrgsInDb = await prisma.organization.findMany()
    
    console.log('📋 Organisations dans la DB:', allOrgsInDb.map(o => ({ id: o.id, name: o.name, clerkOrgId: o.clerkOrgId })))

    // Si deleteAll est true, supprimer TOUTES les organisations de la DB
    // Sinon, supprimer seulement celles dont l'utilisateur n'est pas membre
    let orphanOrgs = []
    if (deleteAll) {
      // Supprimer toutes les organisations de la DB
      orphanOrgs = allOrgsInDb
      console.log('🗑️ Mode suppression totale activé')
    } else {
      // Identifier les organisations orphelines (dans DB mais pas dans les membreships de l'utilisateur)
      orphanOrgs = allOrgsInDb.filter(
        org => !clerkOrgIds.has(org.clerkOrgId)
      )
    }
    
    console.log('🔍 Organisations à supprimer:', orphanOrgs.map(o => ({ id: o.id, name: o.name, clerkOrgId: o.clerkOrgId })))

    // Supprimer les organisations orphelines
    const deletedOrgs = []
    for (const org of orphanOrgs) {
      try {
        // Supprimer les données liées (restaurants, etc.)
        await prisma.restaurant.deleteMany({
          where: { organizationId: org.id },
        })
        
        // Supprimer l'organisation
        await prisma.organization.delete({
          where: { id: org.id },
        })
        
        deletedOrgs.push({
          id: org.id,
          name: org.name,
          clerkOrgId: org.clerkOrgId,
        })
      } catch (error) {
        console.error(`Erreur lors de la suppression de ${org.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedOrgs,
      count: deletedOrgs.length,
      message: `${deletedOrgs.length} organisation(s) orpheline(s) supprimée(s)`,
    })
  } catch (error) {
    console.error('Error cleaning up organizations:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du nettoyage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
