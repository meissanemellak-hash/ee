import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Route API pour nettoyer les organisations orphelines
 * (qui existent dans la DB mais pas dans Clerk)
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = auth().userId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json().catch(() => ({}))
    const { deleteAll = false } = body

    // Récupérer toutes les organisations de l'utilisateur depuis Clerk
    const client = await clerkClient()
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const clerkOrgIds = new Set(
      userMemberships.data?.map(m => m.organization.id) || []
    )

    logger.log('📋 Organisations Clerk de l\'utilisateur:', Array.from(clerkOrgIds))

    // Récupérer toutes les organisations de la DB
    const allOrgsInDb = await prisma.organization.findMany()

    logger.log('📋 Organisations dans la DB:', allOrgsInDb.map(o => ({ id: o.id, name: o.name, clerkOrgId: o.clerkOrgId })))

    // Si deleteAll est true, supprimer TOUTES les organisations de la DB
    // Sinon, supprimer seulement celles dont l'utilisateur n'est pas membre
    let orphanOrgs = []
    if (deleteAll) {
      // Supprimer toutes les organisations de la DB
      orphanOrgs = allOrgsInDb
      logger.log('🗑️ Mode suppression totale activé')
    } else {
      // Identifier les organisations orphelines (dans DB mais pas dans les membreships de l'utilisateur)
      orphanOrgs = allOrgsInDb.filter(
        org => !clerkOrgIds.has(org.clerkOrgId)
      )
    }

    logger.log('🔍 Organisations à supprimer:', orphanOrgs.map(o => ({ id: o.id, name: o.name, clerkOrgId: o.clerkOrgId })))

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
        logger.error(`Erreur lors de la suppression de ${org.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedOrgs,
      count: deletedOrgs.length,
      message: `${deletedOrgs.length} organisation(s) orpheline(s) supprimée(s)`,
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error cleaning up organizations:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du nettoyage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
