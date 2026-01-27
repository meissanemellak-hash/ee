import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/fix-id
 * Corrige l'ID de l'organisation dans la DB pour qu'il corresponde à celui dans Clerk
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { correctClerkOrgId, currentOrgId } = body

    if (!correctClerkOrgId) {
      return NextResponse.json(
        { error: 'correctClerkOrgId is required' },
        { status: 400 }
      )
    }

    // Vérifier que l'organisation existe dans Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    
    let clerkOrg
    try {
      clerkOrg = await client.organizations.getOrganization({ 
        organizationId: correctClerkOrgId 
      })
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'L\'organisation n\'existe pas dans Clerk',
          details: error.message || 'ID invalide'
        },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est membre de cette organisation
    const userMemberships = await client.users.getOrganizationMembershipList({ userId })
    const membership = userMemberships.data?.find(m => m.organization.id === correctClerkOrgId)
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas membre de cette organisation' },
        { status: 403 }
      )
    }

    // Chercher l'organisation dans la DB par l'ID actuel (si fourni) ou par le nom
    let organization = null
    
    if (currentOrgId) {
      // Chercher par le clerkOrgId actuel dans la DB
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: currentOrgId },
      })
      
      // Si pas trouvée par clerkOrgId, chercher par l'ID Prisma (si c'était un ID Prisma qui a été passé)
      if (!organization && !currentOrgId.startsWith('org_')) {
        try {
          organization = await prisma.organization.findUnique({
            where: { id: currentOrgId },
          })
        } catch (error) {
          // Ignorer l'erreur, continuer la recherche
        }
      }
    }
    
    // Si pas trouvée, chercher par nom
    if (!organization) {
      organization = await prisma.organization.findFirst({
        where: { name: clerkOrg.name },
      })
    }

    if (!organization) {
      // Si l'organisation n'existe pas dans la DB, la créer
      try {
        organization = await prisma.organization.create({
          data: {
            name: clerkOrg.name,
            clerkOrgId: correctClerkOrgId,
            shrinkPct: 0.1,
          },
        })
        
        console.log('[POST /api/organizations/fix-id] ✅ Organisation créée dans la DB avec le bon ID')
        
        return NextResponse.json({
          success: true,
          message: 'Organisation créée dans la DB avec le bon ID',
          organization: {
            id: organization.id,
            name: organization.name,
            clerkOrgId: organization.clerkOrgId,
          },
        })
      } catch (error: any) {
        console.error('[POST /api/organizations/fix-id] ❌ Erreur création:', error)
        
        // Si c'est une erreur de contrainte unique, l'organisation existe peut-être déjà
        if (error?.code === 'P2002' || (error instanceof Error && error.message.includes('Unique constraint'))) {
          // Essayer de récupérer l'organisation existante
          const existingOrg = await prisma.organization.findUnique({
            where: { clerkOrgId: correctClerkOrgId },
          })
          
          if (existingOrg) {
            return NextResponse.json({
              success: true,
              message: 'L\'organisation existe déjà avec le bon ID',
              organization: {
                id: existingOrg.id,
                name: existingOrg.name,
                clerkOrgId: existingOrg.clerkOrgId,
              },
            })
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Erreur lors de la création de l\'organisation',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
          },
          { status: 500 }
        )
      }
    }

    // Si l'ID est déjà correct, rien à faire
    if (organization.clerkOrgId === correctClerkOrgId) {
      console.log('[POST /api/organizations/fix-id] ✅ L\'ID est déjà correct, aucune action nécessaire')
      return NextResponse.json({
        success: true,
        message: 'L\'ID est déjà correct. Aucune modification nécessaire.',
        organization: {
          id: organization.id,
          name: organization.name,
          clerkOrgId: organization.clerkOrgId,
        },
      })
    }

    // Vérifier s'il existe déjà une organisation avec le bon ID
    const existingOrgWithCorrectId = await prisma.organization.findUnique({
      where: { clerkOrgId: correctClerkOrgId },
    })

    if (existingOrgWithCorrectId && existingOrgWithCorrectId.id !== organization.id) {
      // Il y a déjà une organisation avec le bon ID mais c'est une autre organisation
      // On doit fusionner ou supprimer l'ancienne
      return NextResponse.json(
        { 
          error: 'Une autre organisation existe déjà avec cet ID',
          details: `L'organisation "${existingOrgWithCorrectId.name}" utilise déjà l'ID ${correctClerkOrgId}. Contactez le support pour résoudre ce conflit.`,
          existingOrganization: {
            id: existingOrgWithCorrectId.id,
            name: existingOrgWithCorrectId.name,
            clerkOrgId: existingOrgWithCorrectId.clerkOrgId,
          },
          currentOrganization: {
            id: organization.id,
            name: organization.name,
            clerkOrgId: organization.clerkOrgId,
          },
        },
        { status: 409 }
      )
    }

    // Mettre à jour l'ID dans la DB
    try {
      const updatedOrganization = await prisma.organization.update({
        where: { id: organization.id },
        data: { clerkOrgId: correctClerkOrgId },
      })

      console.log('[POST /api/organizations/fix-id] ✅ ID corrigé:', {
        oldId: organization.clerkOrgId,
        newId: correctClerkOrgId,
        organizationName: updatedOrganization.name,
      })

      return NextResponse.json({
        success: true,
        message: 'ID de l\'organisation corrigé avec succès',
        organization: {
          id: updatedOrganization.id,
          name: updatedOrganization.name,
          oldClerkOrgId: organization.clerkOrgId,
          newClerkOrgId: updatedOrganization.clerkOrgId,
        },
      })
    } catch (error) {
      console.error('[POST /api/organizations/fix-id] Erreur mise à jour:', error)
      return NextResponse.json(
        { 
          error: 'Erreur lors de la mise à jour de l\'ID',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[POST /api/organizations/fix-id] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
