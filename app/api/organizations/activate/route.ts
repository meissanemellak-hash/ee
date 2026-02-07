import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Route API pour activer une organisation
 * Cette route utilise Clerk côté serveur pour éviter les problèmes de cookies()
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: currentOrgId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId est requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est membre de cette organisation
    const client = await clerkClient()
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    
    const membership = userMemberships.data?.find(
      m => m.organization.id === organizationId
    )

    if (!membership) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas membre de cette organisation' },
        { status: 403 }
      )
    }

    // Vérifier/créer l'organisation dans la DB
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId: organizationId },
    })

    if (!organization) {
      // Créer l'organisation dans la DB
      try {
        organization = await prisma.organization.create({
          data: {
            name: membership.organization.name,
            clerkOrgId: organizationId,
            shrinkPct: 0.1,
          },
        })
      } catch (dbError) {
        // Si l'organisation existe déjà (race condition), la récupérer
        if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
          organization = await prisma.organization.findUnique({
            where: { clerkOrgId: organizationId },
          })
        } else {
          throw dbError
        }
      }
    }

    // IMPORTANT: On ne peut pas activer l'organisation côté serveur avec Clerk
    // L'activation doit se faire côté client via le cookie de session
    // On retourne juste un succès et le client utilisera OrganizationSwitcher ou setActive
    
    return NextResponse.json({
      success: true,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        clerkOrgId: organization.clerkOrgId,
      } : null,
      message: 'Organisation prête à être activée',
    })
  } catch (error) {
    logger.error('❌ Error in activate organization API:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'activation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
