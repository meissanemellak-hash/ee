import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { generateBOMOrderRecommendations } from '@/lib/services/recommender-bom'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clerkOrgId, ...restBody } = body
    const orgIdToUse = authOrgId || clerkOrgId

    console.log('[POST /api/recommendations/bom] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

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
              }
            }
          }
        } catch (error) {
          console.error('[POST /api/recommendations/bom] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
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

    const { restaurantId, shrinkPct, days } = restBody

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant appartient à l'organisation AVANT de générer les recommandations
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    const result = await generateBOMOrderRecommendations(
      restaurantId,
      shrinkPct || 0.1,
      days || 7
    )

    // Log pour debug
    console.log('[POST /api/recommendations/bom] Résultat:', {
      recommendationsCount: result.recommendations.length,
      hasDetails: !!result.details,
      reason: (result.details as any)?.reason,
    })

    // Sauvegarder la recommandation
    if (result.recommendations.length > 0) {
      // S'assurer que estimatedSavings est inclus dans les données sauvegardées
      const dataToSave = {
        ...result.details,
        estimatedSavings: result.estimatedSavings,
      }
      
      console.log('[POST /api/recommendations/bom] Sauvegarde recommandation avec estimatedSavings:', result.estimatedSavings)
      
      await prisma.recommendation.create({
        data: {
          restaurantId,
          type: 'ORDER',
          data: dataToSave as any,
          priority: 'medium',
          status: 'pending',
        },
      })
    } else {
      // Si aucune recommandation, retourner un message explicatif
      const reason = (result.details as any)?.reason || 'Aucune recommandation générée. Vérifiez que vous avez des produits avec des recettes et des ventes historiques.'
      console.log('[POST /api/recommendations/bom] Aucune recommandation générée. Raison:', reason)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating BOM recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
